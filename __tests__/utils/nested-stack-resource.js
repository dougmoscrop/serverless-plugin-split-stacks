'use strict';

const test = require('ava');
const sinon = require('sinon');

const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils, {
		deploymentBucketName: 'my-bucket-name',
		deploymentBucketEndpoint: 's3.amazonaws.com',
		serverless: {
			service: {
				provider: {},
				package: {
					artifactDirectoryName: 'artifactDir'
				}
			}
		}
	});
	t.context.getFileName = sinon.stub().returns('fileName');
});

test('creates a resource with the right type', t => {
	const output = t.context.nestedStackResource('test');

	t.deepEqual(output.Type, 'AWS::CloudFormation::Stack');
});

test('creates a resource with the right URL', t => {
  t.context.deploymentBucketName = { Ref: 'ServerlessDeploymentBucket' };
  const output = t.context.nestedStackResource('test');

	t.true(Array.isArray(output.Properties.TemplateURL['Fn::Join']));
	t.deepEqual(output.Properties.TemplateURL['Fn::Join'][0], '/');

	t.true(Array.isArray(output.Properties.TemplateURL['Fn::Join'][1]));
	t.deepEqual(output.Properties.TemplateURL['Fn::Join'][1], [
		'https://s3.amazonaws.com',
		{
			Ref: 'ServerlessDeploymentBucket'
		},
		'artifactDir',
		'fileName',
	]);
});

test('creates a resource with the right URL when a custom bucket is used', t => {
	const output = t.context.nestedStackResource('test');

	t.true(Array.isArray(output.Properties.TemplateURL['Fn::Join']));
	t.deepEqual(output.Properties.TemplateURL['Fn::Join'][0], '/');

	t.true(Array.isArray(output.Properties.TemplateURL['Fn::Join'][1]));
	t.deepEqual(output.Properties.TemplateURL['Fn::Join'][1], [
		'https://s3.amazonaws.com',
		'my-bucket-name',
		'artifactDir',
		'fileName',
	]);
});
