'use strict';

const _ = require('lodash');

module.exports = function mergeStackResources() {
  if (this.resourceMigrations) {
    _.each(this.resourceMigrations, migration => {
      delete this.rootTemplate.Resources[migration.logicalId];
      this.rootTemplate.Resources[migration.stackName] = migration.stackResource;
    });
  }
};
