'use strict';

const test = require('ava');
const sinon = require('sinon');

const { ListStackResourcesCommand } = require('@aws-sdk/client-cloudformation');
const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils, { provider: {} });
});

test('calls once', t => {
	const client = { send: () => {} };
	const mock = sinon.mock(client);

	mock.expects('send')
		.once()
		.withArgs(sinon.match(command => {
			return command instanceof ListStackResourcesCommand
				&& command.input.StackName === 'foo'
				&& command.input.NextToken === undefined;
		}))
		.resolves({
			StackResourceSummaries: ['a']
		});

	t.context.getCloudFormationClient = sinon.stub().resolves(client);

	return t.context.getStackSummary('foo')
		.then(summary => {
			mock.verify();
			t.deepEqual(summary, ['a']);
		});
});

test('calls twice with NextToken', t => {
	const send = sinon.stub()
		.onCall(0).resolves({
			StackResourceSummaries: ['a'],
			NextToken: 'banana'
		})
		.onCall(1).resolves({
			StackResourceSummaries: ['b']
		});

	t.context.getCloudFormationClient = sinon.stub().resolves({ send });

	return t.context.getStackSummary('foo')
		.then(summary => {
			t.true(send.calledTwice);
			t.deepEqual(summary, ['a', 'b']);
		});
});

test('retry on Rate exceeeded', t => {
	const send = sinon.stub()
		.onCall(0).rejects({
			message: 'Rate exceeded'
		})
		.onCall(1).rejects({
			message: 'Rate exceeded'
		})
		.onCall(2).resolves({
			StackResourceSummaries: ['a']
		});

	t.context.getCloudFormationClient = sinon.stub().resolves({ send });

	return t.context.getStackSummary('foo')
		.then(summary => {
			t.true(send.calledThrice);
			t.deepEqual(summary, ['a']);
		});
});