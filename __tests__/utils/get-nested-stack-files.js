'use strict';

const path = require('path');

const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const fs = {
	readdirSync: sinon.stub().returns([
		'foo.json',
		'cloudformation-template-create.json',
		'cloudformation-Foo-nested-stack.json',
		'cloudformation-Foo-nested-stack-2.json'
	]),
	createReadStream: sinon.stub().returns()
};

const utils = proxyquire('../../lib/utils', {
	fs
});

test.beforeEach(t => {
	t.context = Object.assign({}, utils, {
		serverless: {
			config: {
				servicePath: '.'
			},
			service: {
				package: {
					artifactDirectoryName: 'test'
				}
			}
    }
	});
});

test('returns matching files', t => {
	const files = t.context.getNestedStackFiles();
	t.true(files.length === 2);
	t.true(files[0].key === path.join('test', 'cloudformation-Foo-nested-stack.json'));
	t.true(files[1].key === path.join('test', 'cloudformation-Foo-nested-stack-2.json'));
});

test('returns a read stream constructor', t => {
	const files = t.context.getNestedStackFiles();

	t.true(typeof files[0].createReadStream === 'function');

	files[0].createReadStream();

	t.true(fs.createReadStream.calledOnce);
});
