'use strict';

module.exports = function sequenceStacks() {
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
