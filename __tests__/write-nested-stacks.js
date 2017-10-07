'use strict';

const test = require('ava');
const sinon = require('sinon');

const writeNestedStacks = require('../lib/write-nested-stacks');

test.beforeEach(t => {
	t.context = Object.assign({}, { writeNestedStacks }, {
    serverless: {
			config: {
				servicePath: '.'
			},
      utils: {
				writeFileSync: sinon.stub()
			}
    }
  });
});

test('calls write for each stack', t => {
	t.context.getFileName = () => 'foo.json';
	t.context.nestedStacks = {
		Foo: {},
		Bar: {}
	};

	t.context.writeNestedStacks();

	t.true(t.context.serverless.utils.writeFileSync.calledTwice);
});

test('does nothing when there are no nested stacks', t => {
	t.context.getFileName = () => 'foo.json';

	t.context.writeNestedStacks();

	t.false(t.context.serverless.utils.writeFileSync.called);
});
