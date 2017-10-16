'use-strict';

const _ = require('lodash');

const migrations = require("../split-stacks-map");

module.exports = function migrateResources() {
  _.each(this.resourcesById, (resource, logicalId) => {
    if (resource.Type in migrations) {
      const migration = migrations[resource.Type];
      const stackName = this.getStackName(migration.destination, migration.allowSuffix);

      if (logicalId in this.resourceMigrations) {
        return;
      }

      this.migrate(logicalId, stackName);
    }
  });
};
