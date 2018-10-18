'use-strict';

const _ = require('lodash');

const Custom = require('./migration-strategy/custom');
const PerType = require('./migration-strategy/per-type');
const PerFunction = require('./migration-strategy/per-function');

module.exports = function migrateResources() {
  const custom = new Custom(this);
  const perType = new PerType(this);
  const perFunction = new PerFunction(this);

  const strategies = [custom, perFunction, perType];

  _.each(this.resourcesById, (resource, logicalId) => {
    // Skip if already handled at migrate-existing-resources step
    if (logicalId in this.resourceMigrations) {
      return;
    }

    const migration = strategies.reduce((memo, strategy) => {
      if (memo || memo === false) {
        return memo;
      }
      return strategy.migration(resource, logicalId);
    }, undefined);

    if (migration) {
      const stackName = this.getStackName(migration.destination, migration.allowSuffix);
      this.migrate(logicalId, stackName);
    }
  });
};
