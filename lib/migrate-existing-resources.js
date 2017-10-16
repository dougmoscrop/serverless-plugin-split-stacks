'use strict';

const migrations = require("../stacks-map");

module.exports = function getCurrentState() {
  const rootStackName = this.provider.naming.getStackName();

  return this.getStackSummary(rootStackName)
    .catch(e => {
      if (e.message === `Stack with id ${rootStackName} does not exist`) {
        return [];
      }
      throw e;
    })
    .then(stackSummary => stackSummary.filter(summary => summary.ResourceType === 'AWS::CloudFormation::Stack'))
    .then(nestedStacks => {
      return Promise.all(nestedStacks.map(stack => {
        const nestedStackId = stack.PhysicalResourceId;

        return this.getStackSummary(nestedStackId)
          .then(nestedStackSummary => {
            nestedStackSummary.forEach(nestedSummary => {
              const logicalId = nestedSummary.LogicalResourceId;
              const resource = this.resourcesById[logicalId];
              if (!resource) return;
              const migration = migrations[resource.Type];
              if (!migration) return;
              const destination = (typeof migration.destination === 'function')
                ? migration.destination(logicalId, resource) : migration.destination;
              if (!destination) return;
              this.migrate(logicalId, this.getStackName(destination, migration.allowSuffix));
            });
          })
      }));
    });
};
