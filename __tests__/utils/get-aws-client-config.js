'use strict';

const test = require('ava');
const sinon = require('sinon');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils, { provider: {} });
});

test('uses provider.getAwsSdkV3Config() when available (osls v4+)', t => {
	const config = { region: 'us-west-2', credentials: { accessKeyId: 'from-v3-config' } };

	t.context.provider = {
		getAwsSdkV3Config: sinon.stub().resolves(config),
		getCredentials: sinon.stub().throws(new Error('getCredentials() should not be called'))
	};

	return t.context.getAwsClientConfig()
		.then(result => {
			t.true(t.context.provider.getAwsSdkV3Config.calledOnce);
			t.deepEqual(result, config);
		});
});

test('falls back to region + unwrapped v2 credentials instance when getAwsSdkV3Config is not available', t => {
	const v2Credentials = { accessKeyId: 'AKIA...', secretAccessKey: 'shh', sessionToken: undefined };

	t.context.provider = {
		getRegion: sinon.stub().returns('us-east-1'),
		getCredentials: sinon.stub().returns({ credentials: v2Credentials })
	};

	return t.context.getAwsClientConfig()
		.then(result => {
			t.deepEqual(result, {
				region: 'us-east-1',
				credentials: {
					accessKeyId: 'AKIA...',
					secretAccessKey: 'shh',
					sessionToken: undefined
				}
			});
		});
});

test('leaves credentials undefined when getCredentials() resolves nothing usable, so the SDK client falls back to its own default chain', t => {
	t.context.provider = {
		getRegion: sinon.stub().returns('us-east-1'),
		getCredentials: sinon.stub().returns({})
	};

	return t.context.getAwsClientConfig()
		.then(result => {
			t.deepEqual(result, {
				region: 'us-east-1',
				credentials: undefined
			});
		});
});
