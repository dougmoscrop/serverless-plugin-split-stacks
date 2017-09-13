'use strict';

const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const utils = proxyquire('../../lib/utils', {
	fs: {
		readdirSync: sinon.stub().returns([
			'foo.json',
			'cloudformation-template-create.json',
			'cloudformation-Foo-nested-stack.json',
			'cloudformation-Foo-nested-stack-2.json'
		])
	}
});

test.beforeEach(t => {
	t.context = Object.assign({}, utils, {
		serverless: {
			config: {
				servicePath: '.'
			}
    }
	});
});

test('returns matching files', t => {
	const files = t.context.getNestedStackFiles();
	t.true(files.length === 2);
	t.true(files[0].name === 'cloudformation-Foo-nested-stack.json');
	t.true(files[1].name === 'cloudformation-Foo-nested-stack-2.json');
});
