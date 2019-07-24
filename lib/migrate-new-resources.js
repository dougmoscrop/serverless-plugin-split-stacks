'use strict';

const _ = require('lodash');

const Custom = require('./migration-strategy/custom');
const PerType = require('./migration-strategy/per-type');
const PerFunction = require('./migration-strategy/per-function');
const PerGroupFunction = require('./migration-strategy/per-group-function');

module.exports = function migrateResources() {
  const custom = new Custom(this);
  const perType = new PerType(this);
  const perFunction = new PerFunction(this);
  const perGroupFunction = new PerGroupFunction(this);

  const strategies = [custom, perFunction, perType, perGroupFunction];

  _.each(this.resourcesById, (resource, logicalId) => {
    const migration = strategies.reduce((memo, strategy) => {
      if (memo || memo === false) {
        return memo;
      }
      return strategy.migration(resource, logicalId);
    }, undefined);

    if (migration) {
      // Skip if already handled at migrate-existing-resources step
      // unless it is being forced
      if (logicalId in this.existingResources && !migration.force) {
        return;
      }

      const stackName = this.getStackName(migration.destination, migration.allowSuffix);
      this.migrate(logicalId, stackName, migration.force);
    }
  });
};
