'use strict';

const sinon = require('sinon');
const test = require('ava');

const Custom = require('../../lib/migration-strategy/custom');
const Plugin = require('../..');

test('adds stacks-map that exists', t => {
  const serverless = {
    version: '1.13.0',
    config: {
      servicePath: `${__dirname}/fixtures/no-export`
    },
    service: {
      custom: {}
    },
    getProvider: () => {}
  };

  const plugin = new Plugin(serverless);
  const strategy = new Custom(plugin);
  
  Plugin.resolveMigration = sinon.stub().returns({ destination: 'foo' });

  t.deepEqual(strategy.migration({ Type: 'Foo::Bar' }), { destination: 'foo' });
  t.true(Plugin.resolveMigration.calledOnce);
});