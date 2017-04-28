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
	const logicalId = utils.getLogicalId({ 'Fn::GetAtt': ['foo', 'arn'] });
	t.deepEqual(logicalId, 'fooarn');
});

test('throws for unrecognized values', t => {
	t.throws(() => {
		utils.getLogicalId({ 'Fn::Join': ['foo', 'arn'] });
	});
});
