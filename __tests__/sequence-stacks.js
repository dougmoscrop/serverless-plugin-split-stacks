'use strict';

const test = require('ava');

const sequenceStacks = require('../lib/sequence-stacks');

const countDependsOn = function (resources) {
  return Object.keys(resources).filter(resourceName => resources[resourceName].DependsOn).length
};

const doesNotBecomeCircular = function (resources) {
  const memo = {};

  Object.keys(resources).forEach(resourceName => {
    const resource = resources[resourceName];
    if (resource.DependsOn) {
      resource.DependsOn.forEach(parent => {
        if (!memo[parent]) {
          memo[parent] = [resourceName];
        } else {
          memo[parent].push(resourceName);
        }
      });
    }
  });

  return Object.keys(memo).every(parentName => memo[parentName].length <= 1);
};

test.beforeEach(t => {
  t.context = Object.assign({ sequenceStacks }, {
    config: {},
    serverless: {
      config: {
        servicePath: __dirname
      }
    },
    provider: {},
    getStackName: () => 'test',
    nestedStacks: {
      '1NestedStack': {},
      '2NestedStack': {},
      '3NestedStack': {},
      '4NestedStack': {},
      '5NestedStack': {},
      '6NestedStack': {},
      '7NestedStack': {},
      '8NestedStack': {},
      '9NestedStack': {},
      '10NestedStack': {}
    },
    rootTemplate: {
      Resources: {
        '1NestedStack': {},
        '2NestedStack': {},
        '3NestedStack': {},
        '4NestedStack': {},
        '5NestedStack': {},
        '6NestedStack': {},
        '7NestedStack': {},
        '8NestedStack': {},
        '9NestedStack': {},
        '10NestedStack': {}
      }
    }
  });
});

test('does nothing if parallelDeployments is disabled', t => {
  t.context.config.stackConcurrency = 0;

  t.context.sequenceStacks();

  t.is(0, countDependsOn(t.context.rootTemplate.Resources));
});

test('creates a single nested stack chain if enabled without parallel deployments', t => {
  t.context.config.stackConcurrency = 1;

  t.context.sequenceStacks();

  t.is(9, countDependsOn(t.context.rootTemplate.Resources));
  t.true(doesNotBecomeCircular(t.context.rootTemplate.Resources));
});

test('keeps already existing dependsOn directives', t => {
  t.context.config.stackConcurrency = 1;
  t.context.rootTemplate.Resources['9NestedStack'].DependsOn = ['Foo'];

  t.context.sequenceStacks();

  t.is(9, countDependsOn(t.context.rootTemplate.Resources));
  t.is(2, t.context.rootTemplate.Resources['9NestedStack'].DependsOn.length);
  t.true(doesNotBecomeCircular(t.context.rootTemplate.Resources));
});

test('creates multiple nested stack chains if enabled with parallel deployments', t => {
  t.context.config.stackConcurrency = 3;

  t.context.sequenceStacks();

  t.is(7, countDependsOn(t.context.rootTemplate.Resources));
  t.true(doesNotBecomeCircular(t.context.rootTemplate.Resources));
});

test('throws an error if both dependsOn and stackConcurrency are defined', t => {
  t.context.config.dependsOn = {
    '1NestedStack': '2NestedStack'
  };
  t.context.config.stackConcurrency = 3;

  t.throws(() => t.context.sequenceStacks(), {
    message: 'Both stackConcurrency and dependsOn are set. Please set only one of these options'
  })
});

test('check for existance of the parent stack if dependsOn config is set', t => {
  t.context.config.dependsOn = {
    '1DoesNotExist': '2NestedStack'
  };

  t.throws(() => t.context.sequenceStacks(), {
    message: 'dependsOn config: Nested stack 1DoesNotExist not found'
  })
});

test('check for existance of the child stack if dependsOn config is set', t => {
  t.context.config.dependsOn = {
    '1NestedStack': '2DoesNotExist'
  };

  t.throws(() => t.context.sequenceStacks(), {
    message: 'dependsOn config: Nested stack 2DoesNotExist not found'
  })
});

test('set DependsOn in the resource if dependsOn config is set', t => {
  t.context.config.dependsOn = {
    '1NestedStack': '3NestedStack'
  };

  t.context.sequenceStacks()

  t.deepEqual(['3NestedStack'], t.context.rootTemplate.Resources['1NestedStack'].DependsOn);
});

test('keeps already existing dependsOn directives if dependsOn config is set', t => {
  t.context.config.dependsOn = {
    '1NestedStack': '3NestedStack'
  };
  t.context.rootTemplate.Resources['1NestedStack'].DependsOn = ['Foo'];

  t.context.sequenceStacks();

  t.deepEqual(['Foo', '3NestedStack'], t.context.rootTemplate.Resources['1NestedStack'].DependsOn);
});

test('should not duplicate dependsOn directives', t => {
  t.context.config.dependsOn = {
    '1NestedStack': '2NestedStack'
  };
  t.context.rootTemplate.Resources['1NestedStack'].DependsOn = ['2NestedStack'];

  t.context.sequenceStacks();

  t.deepEqual(['2NestedStack'], t.context.rootTemplate.Resources['1NestedStack'].DependsOn);
});
