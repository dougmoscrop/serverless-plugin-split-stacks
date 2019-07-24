'use strict';

const path = require('path');

const BaseStrategy = require('./base-strategy');

function loadCustomizations(serverless, plugin) {
  const customPath = path.resolve(
    serverless.config.servicePath,
    plugin.config.custom || 'stacks-map.js'
  );

  try {
    // support exporting a custom stack map
    return /\.js$/.test(customPath)
      ? require(customPath)
      : serverless.utils.readFileSync(customPath);
  } catch (e) {
    // custom is optional unless its been specified
    if (e.code === 'ENOENT' || e.code === 'MODULE_NOT_FOUND' || e.message.split('\n')[0].endsWith(`'${customPath}'`)) {
      if (plugin.config.custom) {
        throw new Error(`serverless-plugin-split-stacks: custom mapping file ${plugin.config.custom} not found`);
      }
      return {};
    }

    throw e;
  }
}

module.exports = class Custom extends BaseStrategy {

  constructor(plugin) {
    super(plugin);
    this.stacksMap = {};

    const customStackMapping = loadCustomizations(plugin.serverless, plugin);

    // legacy, will be removed
    Object.assign(this.stacksMap, plugin.constructor.stacksMap);

    if (typeof customStackMapping === 'function') {
      this.customStackMapping = customStackMapping;
    } else {
      Object.assign(this.stacksMap, customStackMapping);
    }
  }

  // overloaded
  isStrategyActive() {
    return true;
  }

  getDestination(resource, logicalId) {
    // legacy, will be removed
    if (typeof this.plugin.constructor.resolveMigration === 'function') {
      const migration = this.plugin.constructor.resolveMigration.call(this, resource, logicalId, this.plugin.serverless);

      if (migration) {
        return migration;
      }

      if (migration === false) {
        return false;
      }
    }

    if (typeof this.customStackMapping === 'function') {
      const migration = this.customStackMapping(resource, logicalId);

      if (migration) {
        return migration;
      }

      if (migration === false) {
        return false;
      }
    }

    return this.stacksMap[resource.Type];
  }

}
