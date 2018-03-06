'use-strict';

const _ = require('lodash');

const Custom = require('./migration-strategy/custom');
const PerType = require('./migration-strategy/per-type');
const PerFunction = require('./migration-strategy/per-function');

module.exports = function migrateResources() {
  // set up stacksMap because existing stacks-map.js code expects it
  this.stacksMap = {};

  const custom = new Custom(this);
  const perType = new PerType(this);
  const perFunction = new PerFunction(this);

  _.each(this.resourcesById, (resource, logicalId) => {
    // Skip if already handled at migrate-existing-resources step
    if (logicalId in this.resourceMigrations) {
      return;
    }

    const migration = custom.migration(resource, logicalId)
      || perFunction.migration(resource, logicalId)
      || perType.migration(resource, logicalId);

    if (migration) {
      const stackName = this.getStackName(migration.destination, migration.allowSuffix);
      this.migrate(logicalId, stackName);
    }
  });
};
