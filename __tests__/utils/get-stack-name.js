'use strict';

const test = require('ava');
const sinon = require('sinon');

const utils = require('../../lib/utils');

const fullResources = Array(500).fill().map(() => {});
const fullOutputs = Array(200).fill().map(() => {});

test.beforeEach(t => {
	t.context = Object.assign({}, utils);
});

test('returns destination (simple case)', t => {
	const stackName = t.context.getStackName('Foo');
	t.deepEqual(stackName, 'FooNestedStack');
});

test('throws when stack is full and allowSuffix is false', t => {
	const stub = sinon.stub(t.context, 'nestedStack')
		.onCall(0).returns({
			Resources: fullResources
		})
		.onCall(1).returns({
			Resources: {
				Foo: {}
			}
		});

	const err =	t.throws(() => t.context.getStackName('Foo'));
	t.true(stub.calledOnce);
	t.deepEqual(err.message, 'Destination stack Foo is already full!');
});

test('returns a suffixed name (one full of resources)', t => {
	const stub = sinon.stub(t.context, 'nestedStack')
		.onCall(0).returns({
			Resources: fullResources
		})
		.onCall(1).returns({
			Resources: {
				Foo: {}
			}
		});

	const stackName = t.context.getStackName('Foo', true);
	t.deepEqual(stackName, 'FooNestedStack2');
	t.true(stub.calledTwice);
});

test('returns a suffixed name (two full of resources)', t => {
	const stub = sinon.stub(t.context, 'nestedStack')
		.onCall(0).returns({
			Resources: fullResources
		})
		.onCall(1).returns({
			Resources: fullResources
		})
		.onCall(2).returns({
			Resources: {}
		});

	const stackName = t.context.getStackName('Foo', true);
	t.deepEqual(stackName, 'FooNestedStack3');
	t.true(stub.calledThrice);
});

test('returns a suffixed name (one full of outputs)', t => {
	const stub = sinon.stub(t.context, 'nestedStack')
		.onCall(0).returns({
      Resources: { Foo: {} },
      Outputs: fullOutputs,
		})
		.onCall(1).returns({
			Resources: {
				Foo: {}
			}
		});

	const stackName = t.context.getStackName('Foo', true);
	t.deepEqual(stackName, 'FooNestedStack2');
	t.true(stub.calledTwice);
});

test('returns a suffixed name (one resources, one outputs)', t => {
	const stub = sinon.stub(t.context, 'nestedStack')
		.onCall(0).returns({
      Resources: fullResources,
      Outputs: {},
		})
		.onCall(1).returns({
			Resources: {
        Foo: {},
      },
      Outputs: fullOutputs,
		})
		.onCall(2).returns({
      Resources: {},
      Outputs: {
        X: {},
      }
		});

	const stackName = t.context.getStackName('Foo', true);
	t.deepEqual(stackName, 'FooNestedStack3');
	t.true(stub.calledThrice);
});
