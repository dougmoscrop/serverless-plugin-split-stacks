'use-strict';

const _ = require('lodash');

module.exports = function migrateResources() {
  _.each(this.resourcesById, (resource, logicalId) => {
    if (resource.Type in this.constructor.stacksMap) {
      const migration = this.constructor.stacksMap[resource.Type];

      const stackName = this.getStackName(migration.destination, migration.allowSuffix);

      if (logicalId in this.resourceMigrations) {
        return;
      }

      this.migrate(logicalId, stackName);
    }
  });
};
