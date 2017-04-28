'use strict';

const test = require('ava');

const Migration = require('../lib/migration');

test.beforeEach(t => {
	t.context.migration = new Migration({
		stack: {
			Parameters: {}
		},
		stackResource: {
			Properties: {
				Parameters: {}
			}
		}
	});
});

test('returns a Ref', t => {
	const parameter = t.context.migration.parameterize('Foo', 123);
	t.deepEqual({ Ref: 'FooParameter' }, parameter);
});

test('adds to stack', t => {
	t.context.migration.parameterize('Foo', 123);
	t.deepEqual(t.context.migration.stack.Parameters.FooParameter, { Type: 'String' });
});

test('adds to stackResource', t => {
	t.context.migration.parameterize('Foo', 123);
	t.deepEqual(t.context.migration.stackResource.Properties.Parameters.FooParameter, 123);
});
