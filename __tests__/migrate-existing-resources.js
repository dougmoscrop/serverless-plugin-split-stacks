'use strict';

const sinon = require('sinon');
const test = require('ava');

const migrateExistingResources = require('../lib/migrate-existing-resources');

test.beforeEach(t => {
	t.context = Object.assign({ resourceMigrations: {} }, { migrateExistingResources }, {
		getStackName: name => `${name}NestedStack`,
		getStackNameBase: name => `${name}NestedStack`,
		migrate: sinon.stub(),
		constructor: { stacksMap: { 'AWS::Test::Resource': { destination: 'Foo', allowSuffix: true } } }
	});
	t.context.provider = {
		naming: {
			getStackName: () => 'test-existing-stack'
		}
	};
});

test('does not call migrate when there are no existing resources', t => {
	t.context.getStackSummary = sinon.stub().resolves([]);
	t.context.resourcesById = { Foo: {} };

	return t.context.migrateExistingResources()
		.then(() => {
			t.false(t.context.migrate.called);
		});
});

test('does not call migrate when an existing resource no longer exists', t => {
	t.context.getStackSummary = sinon.stub()
		.onCall(0).resolves([{
			ResourceType: 'AWS::CloudFormation::Stack',
			PhysicalResourceId: 'some-nested-stack-id'
		}])
		.onCall(1).resolves([{
			ResourceType: 'AWS::Test::Resource',
			LogicalResourceId: 'Foo'
		}]);

	t.context.resourcesById = { Bar: {} };

	return t.context.migrateExistingResources()
		.then(() => {
				t.false(t.context.migrate.called);
		});
});

test('calls migrate when an existing resource still exists', t => {
	t.context.getStackSummary = sinon.stub()
		.onCall(0).resolves([{
			ResourceType: 'AWS::CloudFormation::Stack',
			PhysicalResourceId: 'some-nested-stack-id',
			LogicalResourceId: 'FooNestedStack'
		}])
		.onCall(1).resolves([{
			ResourceType: 'AWS::Test::Resource',
			LogicalResourceId: 'Foo'
		}]);

	t.context.resourcesById = { Foo: { Type: 'AWS::Test::Resource' }, Bar: {} };

	return t.context.migrateExistingResources()
		.then(() => {
				t.true(t.context.migrate.called);
		});
});

test('handles first-time deploy stack does not exist', t => {
	t.context.getStackSummary = sinon.stub()
		.rejects(new Error('Stack with id test-existing-stack does not exist'));

	return t.context.migrateExistingResources()
		.then(() => {
				t.false(t.context.migrate.called);
		});
})
