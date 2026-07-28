'use strict';

const test = require('ava');
const sinon = require('sinon');

const setDeploymentBucketName = require('../../lib/deployment-bucket-name');

function createOriginalContext() {
  return {
    serverless: {
      service: {
        provider: {}
      },
      getProvider: sinon.stub().callsFake((providerName) => {
        if (providerName === 'aws') {
          return {
            getServerlessDeploymentBucketName: sinon.stub().resolves('mock-bucket-name')
          };
        }
      }),
      version: '4.0.0'
    },
    options: {}
  };
}

test.beforeEach(t => {
  t.context = createOriginalContext();
});

test('sets deployment bucket name if explicitly defined', async t => {
  t.context.serverless.service.provider.deploymentBucket = 'explicit-bucket';

  await setDeploymentBucketName.call(t.context);

  t.is(t.context.deploymentBucketName, 'explicit-bucket');
});

test('fetches deployment bucket name for Serverless v4 and sets it', async t => {
  t.context.serverless.version = '4.0.0';
  t.context.serverless.service.provider.deploymentBucket = undefined;

  await setDeploymentBucketName.call(t.context);

  t.is(t.context.deploymentBucketName, 'mock-bucket-name');
});

test('sets deployment bucket using Ref syntax for Serverless versions below v4', async t => {
  t.context.serverless.version = '3.8.0';
  t.context.serverless.service.provider.deploymentBucket = undefined;

  await setDeploymentBucketName.call(t.context);

  t.deepEqual(t.context.deploymentBucketName, { Ref: 'ServerlessDeploymentBucket' });
});

test('throws an error if getServerlessDeploymentBucketName fails', async t => {
  t.context.serverless.getProvider = sinon.fake.returns({
    getServerlessDeploymentBucketName: sinon.fake.rejects(new Error('Failed to retrieve bucket'))
  });
  t.context.serverless.version = '4.0.0';

  const error = await t.throwsAsync(() => setDeploymentBucketName.call(t.context));

  t.is(error.message, 'Failed to set deployment bucket name: Failed to retrieve bucket');
});
