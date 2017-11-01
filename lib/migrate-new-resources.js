'use-strict';

const _ = require('lodash');

module.exports = function migrateResources() {
  _.each(this.resourcesById, (resource, logicalId) => {

    // Skip if already handled at migrate-existing-resources step
    if (logicalId in this.resourceMigrations) return;

    const migration = this.constructor.resolveMigration(resource, logicalId, this.serverless);
    if (!migration) return;

    const stackName = this.getStackName(migration.destination, migration.allowSuffix);
    this.migrate(logicalId, stackName);
  });
};
