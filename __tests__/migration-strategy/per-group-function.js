'use strict';

const sinon = require('sinon');
const test = require('ava');

const PerGroupFunction = require('../../lib/migration-strategy/per-group-function');

const clone = function (object) {
  return JSON.parse(JSON.stringify(object));
};

const countDependsOn = function (resources) {
  return Object.keys(resources).filter(resourceName => resources[resourceName].DependsOn).length
};

const doesNotBecomeCircular = function (resources) {
  const memo = {};

  Object.keys(resources).forEach(resourceName => {
    const resource = resources[resourceName];
    if (resource.DependsOn) {
      resource.DependsOn.forEach(parent => {
        if (!memo[parent]) {
          memo[parent] = [resourceName];
        } else {
          memo[parent].push(resourceName);
        }
      });
    }
  });

  return Object.keys(memo).every(parentName => memo[parentName].length <= 1);
};

test.beforeEach(t => {
  const apiGatewayPlugin = {
    constructor: {
      name: 'AwsCompileApigEvents'
    },
    validated: {
      events: require('./fixtures/per-group-function/api-gateway-resources')
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
          'exampleTwo': {},
          'exampleThree': {}
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
  t.context.plugin.config.perGroupFunction = false;

  const migrationStrategy = new PerGroupFunction(t.context.plugin);

  t.falsy(migrationStrategy.lambdaNames);
});

test('throws an error if configured badly', t => {
  t.context.plugin.config.perGroupFunction = true;
  t.context.plugin.config.nestedStackCount = 1;

  t.throws(() => {
    new PerGroupFunction(t.context.plugin);
  });
});

test('initializes if enabled', t => {
  t.context.plugin.config.perGroupFunction = true;
  t.context.plugin.config.nestedStackCount = 2;

  const migrationStrategy = new PerGroupFunction(t.context.plugin);

  t.truthy(migrationStrategy.lambdaNames);
  t.is(migrationStrategy.apiGatewayResourceMap.size, 9);
});

test('does not migrate resources if disabled', t => {
  t.context.plugin.config.perGroupFunction = false;
  t.plan(20);

  const migrationStrategy = new PerGroupFunction(t.context.plugin);
  const migrationResources = clone(require('./fixtures/per-group-function/migration-resources'));

  Object.keys(migrationResources).forEach(logicalId => {
    const migration = migrationStrategy.migration(migrationResources[logicalId], logicalId);

    t.falsy(migration);
  });
});

test('migrates resources in Nested Stacks', t => {
  t.context.plugin.config.perGroupFunction = true;
  t.context.plugin.config.nestedStackCount = 2;
  t.plan(20);

  const migrationStrategy = new PerGroupFunction(t.context.plugin);
  const migrationResources = clone(require('./fixtures/per-group-function/migration-resources'));

  Object.keys(migrationResources).forEach(logicalId => {
    const migration = migrationStrategy.migration(migrationResources[logicalId], logicalId);

    t.is(Boolean(migration), migrationResources[logicalId].Migrated);
  });
});

test('migrates resources in Nested Stacks and ', t => {
  t.context.plugin.config.perGroupFunction = true;
  t.context.plugin.config.nestedStackCount = 2;
  t.context.plugin.config.resourceParallelDeployments = 2;
  t.plan(22);

  const migrationStrategy = new PerGroupFunction(t.context.plugin);
  const migrationResources = clone(require('./fixtures/per-group-function/migration-resources'));

  Object.keys(migrationResources).forEach(logicalId => {
    const migration = migrationStrategy.migration(migrationResources[logicalId], logicalId);

    t.is(Boolean(migration), migrationResources[logicalId].Migrated);
  });

  t.is(countDependsOn(migrationResources), 13);
  t.true(doesNotBecomeCircular(migrationResources));
});
