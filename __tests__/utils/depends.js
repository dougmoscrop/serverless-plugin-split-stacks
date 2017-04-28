'use strict';

const test = require('ava');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils);
});

test('depends should add a dependency when none defined', t => {
	const resource = {};
	t.context.depends(resource, 'foo');
	t.deepEqual(resource.DependsOn, ['foo']);
});

test('depends should add a dependency to null', t => {
	const resource = { DependsOn: null };
	t.context.depends(resource, 'foo');
	t.deepEqual(resource.DependsOn, ['foo']);
});

test('depends should add a dependency to undefined', t => {
	const resource = { DependsOn: undefined };
	t.context.depends(resource, 'foo');
	t.deepEqual(resource.DependsOn, ['foo']);
});

test('depends should add a dependency to array', t => {
	const resource = { DependsOn: ['bar'] };
	t.context.depends(resource, 'foo');
	t.deepEqual(resource.DependsOn, ['bar', 'foo']);
});

test('depends should add a dependency to string', t => {
	const resource = { DependsOn: 'bar' };
	t.context.depends(resource, 'foo');
	t.deepEqual(resource.DependsOn, ['bar', 'foo']);
});

test('depends should not duplicate a dependency', t => {
	const resource = { DependsOn: ['foo'] };
	t.context.depends(resource, 'foo');
	t.deepEqual(resource.DependsOn, ['foo']);
});
