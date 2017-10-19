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
              const logicalId = nestedSummary.LogicalResourceId;
              const resource = this.resourcesById[logicalId];
              if (!resource) return;
              const migration = this.constructor.stacksMap[resource.Type];
              if (!migration) return;

              // Purpose of this step is to ensure that resources which were eventually distributed
              // across suffixed stacks are in consequent deployments put into very same stacks
              // (We don't want resources to be moved randomly between stacks across deployments)
              if (!migration.allowSuffix) return;
        
              // Mark for migration only if resource was already deployed to stack as one
              // resolved by stacks map rules
              const destination = (typeof migration.destination === 'function')
                ? migration.destination(logicalId, resource) : migration.destination;
              if (!destination) return;

              let stackNameBase = this.getStackNameBase(destination);
              if (!nestedStackName.startsWith(stackNameBase)) return;

              this.migrate(logicalId, nestedStackName);
            });
          })
      }));
    });
};
