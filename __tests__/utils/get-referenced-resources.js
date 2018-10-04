'use strict';

const _ = require('lodash');

const test = require('ava');
const utils = require('../../lib/utils');

test.beforeEach(t => {
	t.context = Object.assign({}, utils, {
    resourcesById: {},
		serverless: {
			service: {
				provider: {}
			}
		}
  });
});

test('should find no references when resourcesById is empty', t => {
  const references = t.context.getReferencedResources({});

  t.deepEqual(references, []);
});

test('should find no references when none exist', t => {
  t.context.resourcesById.blah = 'blah';

  const references = t.context.getReferencedResources({
    foo: 'bar'
  });

  t.deepEqual(references, []);
})

test('should find plain text references', t => {
  t.context.resourcesById = {
    'abc': {},
    'def': {},
		'xyz': {},
    'nope': {}
  };

  const references = t.context.getReferencedResources({
      Foo: {
        One: 'abc',
        Nested: {
          Two: 'def',
					Three: ['xyz']
        },
        Three: 'zzz',
				DependsOn: ['abc']
      }
    });

  t.deepEqual(references.length, 3);
  t.deepEqual(_.difference(references.map(r => r.id), ['abc', 'def', 'xyz']).length, 0);
});

test('should find Ref references', t => {
  t.context.resourcesById = {
    'abc': {},
    'def': {},
    'nope': {}
  };

  const references = t.context.getReferencedResources({
      Foo: {
        One: {
          Ref: 'abc',
        },
        Nested: {
          Two: {
            Ref: 'def'
          }
        },
        Three: 'zzz'
      }
    });

  t.deepEqual(references.length, 2);
  t.deepEqual(_.difference(references.map(r => r.id), ['abc', 'def']).length, 0);
});

test('should find GetAtt references', t => {
  t.context.resourcesById = {
    'abc': {},
    'def': {},
    'nope': {}
  };

  const references = t.context.getReferencedResources({
      Foo: {
        One: {
          'Fn::GetAtt': ['abc', 'arn']
        },
        Nested: {
          Two: {
            'Fn::GetAtt': ['def', 'arn']
          }
        },
        NestedString: {
          Two: {
            'Fn::GetAtt': 'defstr.arn'
          }
        },
        Three: 'zzz'
      }
    });

  t.deepEqual(references.length, 2);
  t.deepEqual(_.difference(references.map(r => r.id), ['abc', 'def', 'defstr']).length, 0);
});

test('should find Join references', t => {
  t.context.resourcesById = {
    'abc': {},
    'def': {},
    'nope': {}
  };

  const references = t.context.getReferencedResources({
      Foo: {
        One: {
          'Fn::Join': [',', ['abc'] ]
        },
        Nested: {
          Two: {
            'Fn::Join': [',', ['qqq', { 'Fn::GetAtt': ['def', 'arn'] } ] ]
          }
        },
        Three: 'zzz'
      }
    });

  t.deepEqual(references.length, 2);
  t.deepEqual(_.difference(references.map(r => r.id), ['abc', 'def']).length, 0);
});

test('should find Fn::Equals references', t => {
  t.context.resourcesById = {
    'abc': {},
    'def': {},
    'nope': {}
  };

  const references = t.context.getReferencedResources({
      SomeCondition: {
        'Fn::Equals': ['foo', { Ref: 'abc' }]
      }
    });

  t.deepEqual(references.map(r => r.id), ['abc']);
});
