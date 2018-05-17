'use strict';

const test = require('ava');

const PerType = require('../../lib/migration-strategy/per-type');
const Plugin = require('../..');

test('adds stacks-map that exists', t => {
  const plugin = {
    config: {},
    stacksMap: {},
    serverless: {
      config: {
        servicePath: `${__dirname}/fixtures/working`
      }
    }
  };

  const strategy = new PerType(plugin);
  
  t.deepEqual(strategy.migration({ Type: 'Foo::Bar' }), {});
  t.deepEqual(strategy.migration({ Type: 'AWS::CloudWatch::Alarm' }), { destination: 'Custom' });
});

test('handles non-existing stacks-map', t => {
  const plugin = {
    config: {},
    stacksMap: {},
    serverless: {
      config: {
        servicePath: `${__dirname}/__does_not_exist__`
      }
    }
  };

  const strategy = new PerType(plugin);
  
  t.deepEqual(strategy.migration({ Type: 'AWS::CloudWatch::Alarm' }), { destination: 'Alarms', allowSuffix: true });
});

test('can disable per type defalts', t => {
  const plugin = {
    config: {
      perType: false
    },
    stacksMap: {},
    serverless: {
      config: {
        servicePath: `${__dirname}/fixtures/__does_not_exist__`
      }
    }
  };

  new PerType(plugin);

  t.deepEqual(plugin.stacksMap, {});
});

test('throws when stacks-map does', t => {
  const plugin = {
    config: {},
    stacksMap: {},
    serverless: {
      config: {
        servicePath: `${__dirname}/fixtures/throwing`
      }
    }
  };

  t.throws(() => {
    new PerType(plugin);
  });
});

test('non-exporting stacks map (legacy)', t => {
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

  const strategy = new PerType(plugin);

  t.deepEqual(strategy.migration({ Type: 'Test' }), {});
  t.deepEqual(strategy.migration({ Type: 'AWS::ApiGateway::Resource' }), undefined);
});