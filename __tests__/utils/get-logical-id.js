'use strict';

const test = require('ava');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils);
});

test('returns a Ref', t => {
	const logicalId = t.context.getLogicalId({ Ref: 'foo' });
	t.deepEqual(logicalId, 'foo');
});

test('returns a GetAtt', t => {
	const logicalId = t.context.getLogicalId({ 'Fn::GetAtt': ['baz', 'arn'] });
	t.deepEqual(logicalId, 'baz');
});

test('returns a string', t => {
	const logicalId = t.context.getLogicalId('bar');
	t.deepEqual(logicalId, 'bar');
});

test('throws for unrecognized values', t => {
	t.throws(() => {
		t.context.getLogicalId({ 'Fn::Join': ['foo', 'arn'] });
	});
});
