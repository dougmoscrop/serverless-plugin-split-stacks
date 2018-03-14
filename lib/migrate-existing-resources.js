'use strict';

const batchPromises = require('batch-promises');

function prepareStacks(nestedStacks) {
  return Promise.all(nestedStacks.map(stack => {
    const nestedStackName = stack.LogicalResourceId;
    const nestedStackId = stack.PhysicalResourceId;

    return this.getStackSummary(nestedStackId)
      .then(nestedStackSummary => {
        nestedStackSummary.forEach(nestedSummary => {
          const logicalId = nestedSummary.LogicalResourceId;
          const resource = this.resourcesById[logicalId];

          if (resource) {
            this.migrate(logicalId, nestedStackName);
          }
        });
      });
  }));
}

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
    .then(nestedStacks => batchPromises(2, prepareStacks(nestedStacks), stack => Promise.resolve(stack)));
};
