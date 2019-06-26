'use strict';

const test = require('ava');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils, {
		serverless: {
			service: {
				provider: {},
				package: {}
			}
		},
    resourcesById: {},
		resourceMigrations: {},
		rootTemplate: {
			Resources: {}
		}
  });
});

test('should find no references when resourcesById is empty', t => {
	const foo = {};

	t.context.resourcesById = { foo };
	t.context.rootTemplate.Resources = { foo };

  t.context.migrate('foo', 'Bar');

	const migration = t.context.resourceMigrations['foo'];

	t.deepEqual(migration.logicalId, 'foo');
	t.true(typeof migration.stack === 'object');
	t.true(typeof migration.stackResource === 'object');
	t.true(typeof migration.stackName === 'string');
});

test('should throw if you try to migrate a resource that was already migrated', t => {
	const foo = {};

	t.context.resourcesById = { foo };
	t.context.resourceMigrations.foo = {};
	t.context.rootTemplate.Resources = { foo };

  const err = t.throws(() => t.context.migrate('foo', 'Baz'));
  t.is(err.message, 'foo was already migrated');
});

test('should throw if you try to migrate a resource that does not exist', t => {
	const foo = {};

	t.context.resourcesById = { foo };
	t.context.rootTemplate.Resources = { foo };

	t.throws(() => t.context.migrate('baz', 'Baz'));
});

test('should not throw if you force migrate a resource that was already migrated', t => {
	const foo = {};

  const ExistingStack = {
    Resources: {
      foo,
    }
  };

	t.context.resourcesById = { foo };
	t.context.resourceMigrations.foo = {
    stack: ExistingStack
  };
	t.context.rootTemplate.Resources = { foo };

  t.context.migrate('foo', 'ForcedStack', true);

  t.deepEqual(ExistingStack.Resources, {});
  t.deepEqual(t.context.resourceMigrations.foo.stackName, 'ForcedStack');
});
