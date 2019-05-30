'use strict';

const sinon = require('sinon');
const test = require('ava');

const Custom = require('../../lib/migration-strategy/custom');
const Plugin = require('../..');

test.beforeEach(() => {
  delete Plugin.resolveMigration;
  Plugin.stacksMap = {};
});

test.serial('uses static resolveMigration', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/__does_not_exist__`
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


test.serial('adds static stacks-map', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
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

  t.deepEqual(strategy.migration({ Type: 'Foo::Bar' }), undefined);
  t.deepEqual(strategy.migration({ Type: 'Test' }), {});
  t.deepEqual(strategy.migration({ Type: 'AWS::CloudWatch::Alarm' }), undefined);

});

test.serial('handles non-existing stacks-map', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/__does_not_exist__`
    },
    service: {
      custom: {}
    },
    getProvider: () => {}
  };

  const plugin = new Plugin(serverless);
  const strategy = new Custom(plugin);

  t.deepEqual(strategy.migration({ Type: 'AWS::CloudWatch::Alarm' }), undefined);
});

test.serial('handles custom stacks-map location', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/working`
    },
    service: {
      custom: {
        splitStacks: {
          custom: 'nested/custom-stacks-map.js'
        }
      }
    },
    getProvider: () => {}
  };

  const plugin = new Plugin(serverless);
  const strategy = new Custom(plugin);

  t.deepEqual(strategy.migration({ Type: 'AWS::CloudWatch::Alarm' }), { destination: 'Custom2' });
});


test('throws when stacks-map does', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/throwing`
    },
    service: {
      custom: {}
    },
    getProvider: () => {}
  };

  const plugin = new Plugin(serverless);

  const err = t.throws(() => {
    new Custom(plugin);
  });

  t.deepEqual(err.message, 'test');
});

test('non-exporting stacks map (legacy)', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/__does_not_exist__`
    },
    service: {
      custom: {}
    },
    getProvider: () => {}
  };

  const plugin = new Plugin(serverless);
  const strategy = new Custom(plugin);

  t.deepEqual(strategy.migration({ Type: 'AWS::ApiGateway::Resource' }), undefined);
});

test('exports a map', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/working`
    },
    service: {
      custom: {}
    },
    getProvider: () => {}
  };

  const plugin = new Plugin(serverless);
  const strategy = new Custom(plugin);

  t.deepEqual(strategy.migration({ Type: 'Foo::Bar' }), {});
  t.deepEqual(strategy.migration({ Type: 'AWS::CloudWatch::Alarm' }), { destination: 'Custom' });
  t.deepEqual(strategy.migration({ Type: 'AWS::ApiGateway::Resource' }), undefined);
});

test('exports a function', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/working-fn`
    },
    service: {
      custom: {}
    },
    getProvider: () => {}
  };

  const plugin = new Plugin(serverless);
  const strategy = new Custom(plugin);

  t.deepEqual(strategy.migration({ Type: 'Foo::Bar' }, 'Foo'), { destination: 'Foo' });
});

test('exports a function and has static stuff', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/working-fn`
    },
    service: {
      custom: {}
    },
    getProvider: () => {}
  };

  Plugin.resolveMigration = sinon.stub().returns(undefined);

  const plugin = new Plugin(serverless);
  const strategy = new Custom(plugin);

  t.deepEqual(strategy.migration({ Type: 'Foo::Bar' }, 'Foo'), { destination: 'Foo' });
});

test('static map and exported function', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/working-fn`
    },
    service: {
      custom: {}
    },
    getProvider: () => {}
  };

  Plugin.stacksMap = { 'Bar': { destination: 'Bar' } };

  const plugin = new Plugin(serverless);
  const strategy = new Custom(plugin);

  t.deepEqual(strategy.migration({ Type: 'Foo::Bar' }, 'Foo'), { destination: 'Foo' });
  t.deepEqual(strategy.migration({ Type: 'Bar' }, 'asdf'), { destination: 'Bar' });
});

test('ignoring just a few resource', t => {
  const serverless = {
    version: '1.13.0',
    utils: {
      readFileSync: path => require(path)
    },
    config: {
      servicePath: `${__dirname}/fixtures/working-fn`
    },
    service: {
      custom: {}
    },
    getProvider: () => {}
  };

  Plugin.resolveMigration = sinon.stub().returns(false);

  const plugin = new Plugin(serverless);
  const strategy = new Custom(plugin);

  t.deepEqual(strategy.migration({ Type: 'Foo::Bar' }, 'Foo'), false);
});
