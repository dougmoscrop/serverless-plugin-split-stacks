'use strict';

const test = require('ava');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils);
});

test('replaces NestedStack with nested-stack', t => {
	const fileName = t.context.getFileName('FooNestedStack');
	t.deepEqual(fileName, 'cloudformation-template-Foo-nested-stack.json');
});

test('replaces NestedStack2 with nested-stack-2', t => {
	const fileName = t.context.getFileName('FooNestedStack2');
	t.deepEqual(fileName, 'cloudformation-template-Foo-nested-stack-2.json');
});
