'use strict';

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
        const nestedStackName = stack.LogicalResourceId;
        const nestedStackId = stack.PhysicalResourceId;

        return this.getStackSummary(nestedStackId)
          .then(nestedStackSummary => {
            nestedStackSummary.forEach(nestedSummary => {
              if (nestedSummary.LogicalResourceId in this.resourcesById) {
                this.migrate(nestedSummary.LogicalResourceId, nestedStackName);
              }
            });
          })
      }));
    });
};
