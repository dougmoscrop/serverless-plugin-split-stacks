'use strict';

const test = require('ava');

const PerType = require('../../lib/migration-strategy/per-type');

test('can be disabled', t => {
  const plugin = {
    config: {
      perType: false
    },
    stacksMap: {},
    serverless: {
      config: {
        servicePath: `${__dirname}/fixtures/__does_not_exist__`
      }
    }
  };

  new PerType(plugin);

  t.deepEqual(plugin.stacksMap, {});
});