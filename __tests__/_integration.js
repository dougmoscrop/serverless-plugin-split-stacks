'use strict';

/* eslint-disable no-console */

const aws = require('aws-sdk');
const path = require('path');

const proxyquire = require('proxyquire');

const Plugin = require('..');

Plugin['@global'] = true;
Plugin['@noCallThru'] = true;

const Serverless = proxyquire('serverless', {
  'serverless-plugin-split-stacks': Plugin
});

process.chdir(path.join(__dirname, 'fixtures'));

function run(cmd) {
  // hack argv so serverless runs a command
  process.argv = process.argv.slice(0, 2).concat(cmd.split(' '));

  const serverless = new Serverless({});

  return serverless.init()
    .then(() => {
      return serverless.run();
    });
}

run('deploy')
  .then(() => {
    return run('invoke -f a');
  })
  .then(() => {
    console.log(`Invoked the 'a' function!`);
  })
  .then(() => {
    return run('invoke -f b');
  })
  .then(() => {
    console.log(`Invoked the 'b' function!`);
  })
  .then(() => {
    const cf = new aws.CloudFormation({
      region: 'us-east-1',
    });

    return cf.describeStackResources({
      StackName: 'split-stack-test-dev'
    })
    .promise()
    .then(res => {
      return res.StackResources.find(res => {
        return res.LogicalResourceId === 'PermissionsNestedStack';
      });
    })
    .then(stack => {
      if (stack) {
        const arnParts = stack.PhysicalResourceId.split(':');
        const nameParts = arnParts[5].split('/');

        return cf.describeStackResources({
          StackName: nameParts[1]
        })
        .promise();
      }
      throw new Error('Could not find Permissions nested stack');
    })
    .then(res => {
      const some = res.StackResources.find(res => res.LogicalResourceId === 'SomePermission');
      const other = res.StackResources.find(res => res.LogicalResourceId === 'SomeOtherPermission');

      if (some) {
        if (other) {
          throw new Error('SomeOtherPermission should not exist due to FalseCondition');
        }
        return;
      }
      throw new Error('SomePermission should exist from TrueCondition')
    })
  })
  .then(() => {
    console.log('Verified Condition support!');
  })
  .then(() => {
    console.log('Test successfull');
  })
  .catch(e => {
    console.error('Test failed: ', e, e.stackTrace);
    process.exitCode = 1;
  })
  .then(() => {
    return run('remove')
  });
