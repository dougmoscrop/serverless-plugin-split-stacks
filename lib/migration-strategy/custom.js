'use strict';

const path = require('path');

function loadCustomizations(config) {
  const customPath = path.resolve(
    config.servicePath,
    'stacks-map.js'
  );

  try {
    // support exporting a custom stack map
    return require(customPath);
  } catch (e) {
    // If module not found ignore, otherwise crash
    if (e.code !== 'MODULE_NOT_FOUND' || !e.message.endsWith(`'${customPath}'`)) {
      throw e;
    }

    return {};
  }
}

module.exports = class Custom {
  
  constructor(plugin) {
    this.plugin = plugin;
    this.stacksMap = {};

    const customStackMapping = loadCustomizations(plugin.serverless.config);

    // legacy, will be removed
    Object.assign(this.stacksMap, plugin.constructor.stacksMap);

    if (typeof customStackMapping === 'function') {
      this.customStackMapping = customStackMapping;
    } else {
      Object.assign(this.stacksMap, customStackMapping);
    }
  }

  migration(resource, logicalId) {
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
    }

    return this.stacksMap[resource.Type];
  }

}
