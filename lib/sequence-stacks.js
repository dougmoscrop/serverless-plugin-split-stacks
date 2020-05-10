'use strict';

module.exports = function sequenceStacks() {
  if (this.config.dependsOn && this.config.stackConcurrency) {
    throw new Error('Both stackConcurrency and dependsOn are set. Please set only one of these options');
  }

  if (this.config.dependsOn) {
    Object.entries(this.config.dependsOn).forEach(([parentStack, childStack]) => {
      const parentResource = this.rootTemplate.Resources[parentStack];

      if (!parentResource) {
        throw new Error(`dependsOn config: Nested stack ${parentStack} not found`);
      }

      const childResource = this.rootTemplate.Resources[childStack];

      if (!childResource) {
        throw new Error(`dependsOn config: Nested stack ${childStack} not found`);
      }

      if (parentResource.DependsOn) {
        if (parentResource.DependsOn.includes(childStack)) {
          return;
        }

        parentResource.DependsOn = [...parentResource.DependsOn, childStack]
      } else {
        parentResource.DependsOn = [childStack]
      }
    });
  }

  if (
    this.config.stackConcurrency
    && typeof this.config.stackConcurrency === 'number'
    && Number.isInteger(this.config.stackConcurrency)
    && this.config.stackConcurrency > 0
  ) {
    const stackConcurrency = this.config.stackConcurrency;

    const stackLogicalIds = Object.keys(this.nestedStacks);

    stackLogicalIds.forEach((logicalId, index) => {
      const resource = this.rootTemplate.Resources[logicalId];
      let parentLogicalId = null;

      if (index >= stackConcurrency) {
        parentLogicalId = stackLogicalIds[index - stackConcurrency];
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
