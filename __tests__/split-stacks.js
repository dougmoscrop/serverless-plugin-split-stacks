'use strict';

const test = require('ava');
const sinon = require('sinon');

const StackSplitter = require('../split-stacks');
const sampleTemplate = require('./fixtures/sample-template.json');

test.beforeEach(t => {
  t.context.serverless = {
    version: '1.13.2',
    service: {
      provider: {
        compiledCloudFormationTemplate: sampleTemplate
      },
      package: {}
    },
    getProvider: () => t.context.provider
  };
  t.context.provider = {
    naming: {
      getStackName: () => 'test-stack'
    },
    getServerlessDeploymentBucketName: () => Promise.resolve('bucket')
  };
  t.context.options = {};
  t.context.splitter = new StackSplitter(t.context.serverless, t.context.options);

  t.context.splitter.writeNestedStacks = sinon.spy();
  t.context.splitter.log = sinon.spy();
  t.context.splitter.getStackSummary = sinon.stub().resolves([]);

  const first = {
    1: 'one'
  };
  const second = {
    2: 'two'
  };

  t.context.splitter.resourcesById = {
    first,
    second
  };
  t.context.splitter.rootTemplate = {
    Resources: {
      second
    }
  };
});

test('splits', t => {
  const splitter = t.context.splitter;

  return splitter.split()
    .then(() => {
      t.true(true);
    });
});

test('prints a summary', t => {
  const splitter = t.context.splitter;

  splitter.nestedStacks = {
    foo: {
      Resources: {}
    }
  };
  splitter.log = sinon.spy();
  splitter.logSummary();

  t.true(splitter.log.called);
});

test('stays quiet when nothing was split', t => {
  const splitter = t.context.splitter;

  splitter.log = sinon.spy();
  splitter.logSummary();

  t.false(splitter.log.called);
});

test('throws if older serverless version is used', t => {
  const e = t.throws(() => {
     new StackSplitter({
       version: '1.10.0'
     });
  });

  t.true(e.message.indexOf('requires serverless 1.13 or higher') > 0);
});
