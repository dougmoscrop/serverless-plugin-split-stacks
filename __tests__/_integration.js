'use strict';

/* eslint-disable no-console */

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
    console.log('Test successfull');
  })
  .catch(e => {
    console.error('Test failed: ', e, e.stackTrace);
    process.exitCode = 1;
  })
  .then(() => {
    return run('remove')
  });
