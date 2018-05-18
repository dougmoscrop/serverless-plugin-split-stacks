'use strict';

const Plugin = require('../..');

module.exports = class Custom {
  
  constructor(plugin) {
    Object.assign(this, { plugin });

  }

  migration(resource, logicalId) {
    if (typeof Plugin.resolveMigration === 'function') {
      return Plugin.resolveMigration.call(this.plugin, resource, logicalId, this.plugin.serverless);
    }
  }

}