'use strict';

const test = require('ava');
const sinon = require('sinon');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const StackSplitter = require('../split-stacks');
const sampleTemplate = require('./fixtures/sample-template.json');

test.beforeEach(t => {
  t.context.serverless = {
    version: '1.13.2',
    utils: {
      readFileSync: path => require(path)
    },
    service: {
      provider: {
        region: 'us-east-1',
        compiledCloudFormationTemplate: sampleTemplate
      },
      package: {}
    },
    getProvider: () => t.context.provider,
    config: {
      servicePath: __dirname
    }
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
      t.pass();
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

test('upload does not get encryption params if provider.deploymentBucketObject not set', t => {
  const splitter = t.context.splitter;

  const stub = splitter.getEncryptionParams = sinon.stub().returns({});

  splitter.provider.getServerlessDeploymentBucketName = sinon.stub().resolves('test');
  splitter.getNestedStackFiles = sinon.stub().returns([{
    key: 'test',
    createReadStream: sinon.stub()
  }]);
  splitter.getS3Client = sinon.stub().resolves({
    send: sinon.stub().resolves()
  });

  return splitter.upload()
    .then(() => {
      t.false(stub.calledOnce);
    });
});

test('upload does get encryption params if provider.deploymentBucketObject set', t => {
  t.context.serverless.service.provider.deploymentBucketObject = {};

  const splitter = t.context.splitter;

  const stub = splitter.getEncryptionParams = sinon.stub().returns({});

  splitter.provider.getServerlessDeploymentBucketName = sinon.stub().resolves('test');
  splitter.getNestedStackFiles = sinon.stub().returns([{
    key: 'test',
    createReadStream: sinon.stub()
  }]);
  splitter.getS3Client = sinon.stub().resolves({
    send: sinon.stub().resolves()
  });

  return splitter.upload()
    .then(() => {
      t.true(stub.calledOnce);
    });
});

test('upload sends a PutObjectCommand for each nested stack file via the S3 client', t => {
  const splitter = t.context.splitter;

  splitter.getEncryptionParams = sinon.stub().returns({});
  splitter.provider.getServerlessDeploymentBucketName = sinon.stub().resolves('test-bucket');
  splitter.getNestedStackFiles = sinon.stub().returns([{
    key: 'nested-stack.json',
    createReadStream: sinon.stub().returns('body')
  }]);

  const client = { send: () => {} };
  const mock = sinon.mock(client);

  mock.expects('send')
    .once()
    .withArgs(sinon.match(command => {
      return command instanceof PutObjectCommand
        && command.input.Bucket === 'test-bucket'
        && command.input.Key === 'nested-stack.json'
        && command.input.Body === 'body'
        && command.input.ContentType === 'application/json';
    }))
    .resolves();

  splitter.getS3Client = sinon.stub().resolves(client);

  return splitter.upload()
    .then(() => {
      t.notThrows(() => mock.verify());
    });
});
