'use strict';

const test = require('ava');
const sinon = require('sinon');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils, { provider: {} });
});

test('calls once', t => {
	const request = sinon.mock().withArgs('CloudFormation', 'listStackResources', {
		StackName: 'foo',
		NextToken: undefined
	})
	.resolves({
		StackResourceSummaries: ['a']
	});

	t.context.provider = {
		request
	};

	return t.context.getStackSummary('foo')
		.then(summary => {
			t.true(request.calledOnce);
			t.deepEqual(summary, ['a']);
		});
});

test('calls twice with NextToken', t => {
	const request = sinon.stub()
		.onCall(0).resolves({
			StackResourceSummaries: ['a'],
			NextToken: 'banana'
		})
		.onCall(1).resolves({
			StackResourceSummaries: ['b']
		});

	t.context.provider = {
		request
	};

	return t.context.getStackSummary('foo')
		.then(summary => {
			t.true(request.calledTwice);
			t.deepEqual(summary, ['a', 'b']);
		});
});
