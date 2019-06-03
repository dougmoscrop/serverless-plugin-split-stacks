'use strict';

module.exports = function sequenceStacks() {
  if (this.config.stackSequence) {
    let stackParallelDeployments = 1;

    if (
      this.config.stackParallelDeployments
      && typeof this.config.stackParallelDeployments === 'number'
      && Number.isInteger(this.config.stackParallelDeployments)
      && this.config.stackParallelDeployments > 0
    ) {
      stackParallelDeployments = this.config.stackParallelDeployments;
    }

    const stackLogicalIds = Object.keys(this.nestedStacks);

    stackLogicalIds.forEach((logicalId, index) => {
      const resource = this.rootTemplate.Resources[logicalId];
      let parentLogicalId = null;

      if (index >= stackParallelDeployments) {
        parentLogicalId = stackLogicalIds[index - stackParallelDeployments];
      }

      if (parentLogicalId) {
        let dependsOn = [parentLogicalId];

        if (resource.DependsOn) {
          dependsOn = dependsOn.concat(resource.DependsOn)
        }

        resource.DependsOn = dependsOn;
      }
    })
  }
};
