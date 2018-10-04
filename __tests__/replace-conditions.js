'use strict';

const sinon = require('sinon');
const test = require('ava');

const replaceConditions = require('../lib/replace-conditions');

test.beforeEach(t => {
	t.context = Object.assign({ replaceConditions }, {
		config: {
			perType: true
		},
		serverless: {
			config: {
				servicePath: __dirname
			}
		},
		provider: {},
		getStackName: () => 'test',
		migrate: sinon.stub()
	});
});

test('ignores resources with no condition', t => {
  const parameterize = sinon.stub().returns('foo');

  t.context.resourceMigrations = {
    Foo: {
      resource: {},
      stack: {},
      parameterize,
    },
  };
  t.context.replaceConditions();
  t.is(parameterize.callCount, 0);
});

test('replaces condition on stack', t => {
  const parameterize = sinon.stub().returns('StubConditionMetParameter');

  const stack = {};

  t.context.resourceMigrations = {
    Foo: {
      resource: {
        Condition: 'SomeCondition',
      },
      stack,
      parameterize,
    },
  };

  t.context.replaceConditions();
  t.is(parameterize.callCount, 1);
  t.deepEqual(stack.Conditions, {
    SomeCondition: {
      'Fn::Equals': ['StubConditionMetParameter', 'true'],
    }
  });
});

test('only parameterizes condition once', t => {
  const parameterize = sinon.stub().returns('StubConditionMetParameter');

  const stack = {};

  t.context.resourceMigrations = {
    Foo: {
      resource: {
        Condition: 'SomeCondition',
      },
      stack,
      parameterize,
    },
    Bar: {
      resource: {
        Condition: 'SomeCondition',
      },
      stack,
      parameterize,
    },
  };

  t.context.replaceConditions();
  t.is(parameterize.callCount, 1);
});

test('different conditions are additive', t => {
  const parameterize = sinon.stub()
    .onFirstCall().returns('StubConditionMetParameter')
    .onSecondCall().returns('StubOtherConditionMetParameter');

  const stack = {};

  t.context.resourceMigrations = {
    Foo: {
      resource: {
        Condition: 'SomeCondition',
      },
      stack,
      parameterize,
    },
    Bar: {
      resource: {
        Condition: 'SomeOtherCondition',
      },
      stack,
      parameterize,
    },
  };

  t.context.replaceConditions();
  t.is(parameterize.callCount, 2);
  t.is(typeof stack.Conditions, 'object')
  t.deepEqual(stack.Conditions, {
    SomeCondition: {
      'Fn::Equals': ['StubConditionMetParameter', 'true'],
    },
    SomeOtherCondition: {
      'Fn::Equals': ['StubOtherConditionMetParameter', 'true'],
    }
  });
});
