'use strict';

const test = require('ava');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils);
});

test('handles resource migration', t => {
	const reference = {
		value: 123,
		getDependencyName: () => 'Foo'
	};
	const migration = {
		stackName: 'A',
		stack: {
			Outputs: {}
		}
	};

	const output = t.context.nestedOutput(reference, migration);

	t.deepEqual(output, { 'Fn::GetAtt': ['A', `Outputs.Foo`] });
	t.deepEqual(migration.stack.Outputs.Foo, { Value: 123 });
});
