'use strict';

module.exports = class Custom {
  
  constructor(plugin) {
    Object.assign(this, { plugin });
  }

  migration(resource, logicalId) {
    if (typeof this.plugin.constructor.resolveMigration === 'function') {
      return this.plugin.constructor.resolveMigration(resource, logicalId, this.plugin.serverless);
    }
  }

}