'use-strict';

const _ = require('lodash');

const migrations = require("../stacks-map");

module.exports = function migrateResources() {
  _.each(this.resourcesById, (resource, logicalId) => {
    if (resource.Type in migrations) {
      const migration = migrations[resource.Type];

      const destination = (typeof migration.destination === 'function')
        ? migration.destination(logicalId, resource) : migration.destination;
      if (!destination) return;

      const stackName = this.getStackName(destination, migration.allowSuffix);

      if (logicalId in this.resourceMigrations) {
        return;
      }

      this.migrate(logicalId, stackName);
    }
  });
};
