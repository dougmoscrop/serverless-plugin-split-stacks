'use strict';

const test = require('ava');

const Reference = require('../lib/reference');

test('can replace value', t => {
  const parent = { test: 'value' };

  const reference = new Reference('foo', {
    parent,
    key: 'test'
  });

  reference.replace('x');
	t.deepEqual(parent.test, 'x');
});

test('name uses logicalId', t => {
  const reference = new Reference('foo', {
    value: { Ref: 'foo' }
  });

	t.deepEqual(reference.getDependencyName(), 'foo');
});

test('name uses GetAtt', t => {
  const reference = new Reference('foo', {
    value: { 'Fn::GetAtt': ['foo', 'Attr'] }
  });

	t.deepEqual(reference.getDependencyName(), 'fooAttr');
});
