'use strict';

const test = require('ava');
const sinon = require('sinon');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils, {
		resourceMigrations: {}
	});
});

test('handles resource migration', t => {
	t.context.resourceMigrations.foo = {};

	const ResourceMigrated = sinon.spy();
	const DependencyMigrated = sinon.spy();
	const ResourceAndDependencyMigrated = sinon.spy();

	t.context.reconcile('foo', 'bar', {
		ResourceMigrated,
		DependencyMigrated,
		ResourceAndDependencyMigrated
	});

	t.true(ResourceMigrated.called);
	t.false(DependencyMigrated.called);
	t.false(ResourceAndDependencyMigrated.called);
});

test('handles dependency migration', t => {
	t.context.resourceMigrations.bar = {};

	const ResourceMigrated = sinon.spy();
	const DependencyMigrated = sinon.spy();
	const ResourceAndDependencyMigrated = sinon.spy();

	t.context.reconcile('foo', 'bar', {
		ResourceMigrated,
		DependencyMigrated,
		ResourceAndDependencyMigrated
	});

	t.false(ResourceMigrated.called);
	t.true(DependencyMigrated.called);
	t.false(ResourceAndDependencyMigrated.called);
});

test('handles resource and dependency migration', t => {
	t.context.resourceMigrations.foo = { stackName: 'A' };
	t.context.resourceMigrations.bar = { stackName: 'B' };

	const ResourceMigrated = sinon.spy();
	const DependencyMigrated = sinon.spy();
	const ResourceAndDependencyMigrated = sinon.spy();

	t.context.reconcile('foo', 'bar', {
		ResourceMigrated,
		DependencyMigrated,
		ResourceAndDependencyMigrated
	});

	t.false(ResourceMigrated.called);
	t.false(DependencyMigrated.called);
	t.true(ResourceAndDependencyMigrated.called);
});

test('handles resource and dependency migration in same stack', t => {
	t.context.resourceMigrations.foo = { stackName: 'A' };
	t.context.resourceMigrations.bar = { stackName: 'A' };

	const ResourceMigrated = sinon.spy();
	const DependencyMigrated = sinon.spy();
	const ResourceAndDependencyMigrated = sinon.spy();

	t.context.reconcile('foo', 'bar', {
		ResourceMigrated,
		DependencyMigrated,
		ResourceAndDependencyMigrated
	});

	t.false(ResourceMigrated.called);
	t.false(DependencyMigrated.called);
	t.false(ResourceAndDependencyMigrated.called);
});
