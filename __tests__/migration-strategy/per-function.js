'use strict';

const sinon = require('sinon');
const test = require('ava');

const PerFunction = require('../../lib/migration-strategy/per-function');

const clone = function (object) {
  return JSON.parse(JSON.stringify(object));
};

test.beforeEach(t => {
  const apiGatewayPlugin = {
    constructor: {
      name: 'AwsCompileApigEvents'
    },
    validated: {
      events: require('./fixtures/per-function/api-gateway-resources')
    },
    getResourceName: sinon.stub().returnsArg(0)
  };

  const plugin = {
    config: {},
    serverless: {
      config: {
        servicePath: __dirname
      },
      pluginManager: {
        plugins: [apiGatewayPlugin]
      },
      service: {
        functions: {
          'exampleOne': {},
          'exampleTwo': {}
        }
      }
    },
    provider: {
      naming: {
        getNormalizedFunctionName: sinon.stub().returnsArg(0),
        getMethodLogicalId: sinon.stub().callsFake((name, method) => name + method),
        getResourceLogicalId: sinon.stub().returnsArg(0)
      }
    },
    getStackName: () => 'test'
  };
  t.context = Object.assign({}, { plugin });
});

test('can be disabled', t => {
  t.context.plugin.config.perFunction = false;

  const migrationStrategy = new PerFunction(t.context.plugin);

  t.falsy(migrationStrategy.lambdaNames);
});

test('initializes if enabled', t => {
  t.context.plugin.config.perFunction = true;

  const migrationStrategy = new PerFunction(t.context.plugin);

  t.truthy(migrationStrategy.lambdaNames);
  t.is(migrationStrategy.apiGatewayResourceMap.size, 6);
});

test('does not migrate resources if disabled', t => {
  t.context.plugin.config.perFunction = false;
  t.plan(14);

  const migrationStrategy = new PerFunction(t.context.plugin);
  const migrationResources = clone(require('./fixtures/per-function/migration-resources'));

  Object.keys(migrationResources).forEach(logicalId => {
    const migration = migrationStrategy.migration(migrationResources[logicalId], logicalId);

    t.falsy(migration);
  });
});

test('migrates resources depending on lambda name', t => {
  t.context.plugin.config.perFunction = true;
  t.plan(26);

  const migrationStrategy = new PerFunction(t.context.plugin);
  const migrationResources = clone(require('./fixtures/per-function/migration-resources'));

  Object.keys(migrationResources).forEach(logicalId => {
    const migration = migrationStrategy.migration(migrationResources[logicalId], logicalId);

    if (migrationResources[logicalId].Destination) {
      t.truthy(migration && migration.destination);
      t.is(migration.destination, migrationResources[logicalId].Destination);
    } else {
      t.falsy(migration);
    }
  });
});

