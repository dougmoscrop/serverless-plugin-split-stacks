'use strict';

const test = require('ava');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils);
});

test('returns a Ref', t => {
	const logicalId = utils.getLogicalId({ Ref: 'foo' });
	t.deepEqual(logicalId, 'foo');
});

test('returns a GetAtt', t => {
	const logicalId = utils.getLogicalId({ 'Fn::GetAtt': ['baz', 'arn'] });
	t.deepEqual(logicalId, 'baz');
});

test('returns a string', t => {
	const logicalId = utils.getLogicalId('bar');
	t.deepEqual(logicalId, 'bar');
});

test('throws for unrecognized values', t => {
	t.throws(() => {
		utils.getLogicalId({ 'Fn::Join': ['foo', 'arn'] });
	});
});
