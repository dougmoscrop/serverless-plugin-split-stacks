'use strict';

const throat = require('throat');

module.exports = function getCurrentState() {
  const rootStackName = this.provider.naming.getStackName();

  return this.getStackSummary(rootStackName)
    .catch(e => {
      if (e.message === `Stack with id ${rootStackName} does not exist`) {
        return [];
      }
      throw e;
    })
    .then(stackSummary => {
      this.existingResources = stackSummary.reduce((memo, summary) => {
        memo[summary.LogicalResourceId] = summary;
        return memo;
      }, {});

      const nestedStacks = stackSummary.filter(summary => summary.ResourceType === 'AWS::CloudFormation::Stack');

      return Promise.all(nestedStacks.map(throat(5, stack => {
        const nestedStackName = stack.LogicalResourceId;
        const nestedStackId = stack.PhysicalResourceId;

        return this.getStackSummary(nestedStackId)
          .then(nestedStackSummary => {
            nestedStackSummary.forEach(nestedSummary => {
              const logicalId = nestedSummary.LogicalResourceId;
              const resource = this.resourcesById[logicalId];

              this.existingResources[logicalId] = nestedSummary;

              if (resource) {
                this.migrate(logicalId, nestedStackName);
              }
            });
          });
      })));
    });
};
