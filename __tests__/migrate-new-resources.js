'use strict';

const proxyquire = require('proxyquire');
const sinon = require('sinon');
const test = require('ava');

test.beforeEach(t => {
  const customMigrationStub = sinon.stub();

  class StubMigration {
    migration() {
      return customMigrationStub.apply(customMigrationStub, arguments);
    }
  }

  const migrateNewResources = proxyquire('../lib/migrate-new-resources', {
    './migration-strategy/custom': StubMigration
  });

	t.context = Object.assign({ resourceMigrations: {} }, { migrateNewResources }, {
		config: {
			perType: true
		},
		serverless: {
			config: {
				servicePath: __dirname
			}
		},
		provider: {},
		getStackName: () => 'test',
		migrate: sinon.stub(),
		customMigrationStub,
	});
});

test('calls migrate for matching resources', t => {
	t.context.resourcesById = {
		Foo: {
			Type: 'AWS::NotMatch'
		},
		Bar: {
			Type: 'AWS::Logs::SubscriptionFilter'
		}
	};

	t.context.migrateNewResources();
	t.true(t.context.migrate.calledOnce);
});

test('does not call migrate for already migrated resources', t => {
	t.context.resourceMigrations.Bar = {};
	t.context.resourcesById = {
		Foo: {
			Type: 'AWS::Logs::SubscriptionFilter'
		},
		Bar: {
			Type: 'AWS::Logs::SubscriptionFilter'
		}
	};

	t.context.migrateNewResources();
	t.true(t.context.migrate.calledOnce);
});

test('does not migrate when custom returns false', t => {
	t.context.resourcesById = {
		Foo: {
			Type: 'AWS::Logs::SubscriptionFilter'
		},
	};

  t.context.customMigrationStub.returns(false);
  t.context.migrateNewResources();
  t.is(t.context.customMigrationStub.callCount, 1);
	t.is(t.context.migrate.callCount, 0);
});
