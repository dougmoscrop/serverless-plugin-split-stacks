'use strict';

const test = require('ava');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils);
});

test('works with empty config', t => {
	const params = t.context.getEncryptionParams({});
	t.deepEqual(params, {});
});

test('assigns named config value', t => {
	const params = t.context.getEncryptionParams({ sseKMSKeyId: 'foo' });
	t.deepEqual(params, { SSEKMSKeyId: 'foo' });
});
