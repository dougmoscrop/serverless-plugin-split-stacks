'use strict';

const test = require('ava');
const sinon = require('sinon');
const https = require('https');

const originalRequest = https.request;

test.beforeEach(t => {
  https.request = originalRequest;
  t.context = Object.assign(
    { config: {} },
    { serverless: { service: { provider: {} } } }
  );
});

test('sets correct deployment bucket for bucket in a region', t => {
  const setDeploymentBucketEndpoint = require('../../lib/deployment-bucket-endpoint');

  t.context.serverless.service.provider.deploymentBucket = 'danyel-test';
  t.context.options = { region: 'us-east-1' };
  const request = {};
  request.on = sinon.fake.returns(undefined);
  request.end = sinon.fake.returns(undefined);
  https.request = sinon.fake.returns(request);
  const promise = setDeploymentBucketEndpoint.apply(t.context, []);

  // assert called
  t.true(https.request.calledOnce);
  t.true(request.on.calledWith('response'));
  t.true(request.on.calledWith('error'));
  t.true(request.end.calledOnce);

  // invoke fake response
  const responseCall = request.on.getCalls().find(e => e.args[0] === 'response');
  const callback = responseCall.args[1];
  callback({ headers: { 'x-amz-bucket-region': 'eu-west-1' } });
  return promise.then(() => {
      t.deepEqual(t.context.deploymentBucketEndpoint, 's3.eu-west-1.amazonaws.com');
    });
});

test('sets correct deployment bucket for bucket (object syntax)', t => {
  const setDeploymentBucketEndpoint = require('../../lib/deployment-bucket-endpoint');

  t.context.serverless.service.provider.deploymentBucket = {
    name: 'danyel-test'
  };

  t.context.options = { region: 'us-east-1' };
  const request = {};
  request.on = sinon.fake.returns(undefined);
  request.end = sinon.fake.returns(undefined);
  https.request = sinon.fake.returns(request);
  const promise = setDeploymentBucketEndpoint.apply(t.context, []);

  // assert called
  t.true(https.request.calledOnce);
  t.true(request.on.calledWith('response'));
  t.true(request.on.calledWith('error'));
  t.true(request.end.calledOnce);

  // invoke fake response
  const responseCall = request.on.getCalls().find(e => e.args[0] === 'response');
  const callback = responseCall.args[1];
  callback({ headers: { 'x-amz-bucket-region': 'eu-west-1' } });
  return promise.then(() => {
      t.deepEqual(t.context.deploymentBucketEndpoint, 's3.eu-west-1.amazonaws.com');
    });
});

test('sets bucket endpoint to service region when deploymentBucket is not set', t => {
  const setDeploymentBucketEndpoint = require('../../lib/deployment-bucket-endpoint');

  t.context.options = { region: 'us-east-2' };
  const request = {};
  request.on = sinon.fake.returns(undefined);
  request.end = sinon.fake.returns(undefined);
  https.request = sinon.fake.returns(request);
  const promise = setDeploymentBucketEndpoint.apply(t.context, []);

  // assert not called
  t.false(https.request.called);
  t.false(request.end.called);

  return promise.then(() => {
      t.deepEqual(t.context.deploymentBucketEndpoint, 's3.us-east-2.amazonaws.com');
    });
});

test('sets bucket region to region from options if region is missing', t => {
  const setDeploymentBucketEndpoint = require('../../lib/deployment-bucket-endpoint');

  t.context.serverless.service.provider.deploymentBucket = 'danyel-test2';
  t.context.options = { region: 'eu-west-1' };

  const request = {};

  request.on = sinon.fake.returns(undefined);
  request.end = sinon.fake.returns(undefined);
  https.request = sinon.fake.returns(request);
  const promise = setDeploymentBucketEndpoint.apply(t.context, []);

  // assert called
  t.true(https.request.calledOnce);
  t.true(request.on.calledWith('response'));
  t.true(request.on.calledWith('error'));
  t.true(request.end.calledOnce);

  // invoke fake response
  const responseCall = request.on.getCalls().find(e => e.args[0] === 'response');
  const callback = responseCall.args[1];
  callback({ headers: { } });
  return promise.then(() => {
      t.deepEqual(t.context.deploymentBucketEndpoint, 's3.eu-west-1.amazonaws.com');
    });
});


