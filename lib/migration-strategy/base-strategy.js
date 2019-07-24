'use strict';

module.exports = class BaseStrategy {

  constructor(plugin) {
    Object.assign(this, { plugin });

    this.lambdaStacks = {};
    this.resourceConcurrency = null;

    if (
      plugin.config.resourceConcurrency
      && typeof plugin.config.resourceConcurrency === 'number'
      && Number.isInteger(plugin.config.resourceConcurrency)
      && plugin.config.resourceConcurrency > 0
    ) {
      this.resourceConcurrency = plugin.config.resourceConcurrency;
    }
  }

  migration(resource, logicalId) {
    if (this.isStrategyActive()) {
      const destination = this.getDestination(resource, logicalId);

      if (destination && this.resourceConcurrency) {
        this.setDependsOn(resource, logicalId, destination.destination);
      }

      return destination;
    }
  }

  // Must be overloaded
  getDestination() {
    return null
  }

  // Must be overloaded
  isStrategyActive() {
    return false;
  }

  setDependsOn(resource, logicalId, nestedStackName) {
    // Lambda already depends on LogGroups, we don't want to create Circular dependencies
    if (resource.Type === 'AWS::Logs::LogGroup') {
      return;
    }
    let dependsOnLogicalId;

    if (!this.lambdaStacks[nestedStackName]) {
      this.lambdaStacks[nestedStackName] = new Array(this.resourceConcurrency)
        .fill([], 0, this.resourceConcurrency);
    }

    const leastFilled = this.lambdaStacks[nestedStackName].reduce(
      (accumulator, item) => accumulator + item.length,
      0
    ) % this.resourceConcurrency;

    if (this.lambdaStacks[nestedStackName][leastFilled]) {
      const lastIndex = this.lambdaStacks[nestedStackName][leastFilled].length - 1;

      dependsOnLogicalId = this.lambdaStacks[nestedStackName][leastFilled][lastIndex];
    }

    this.lambdaStacks[nestedStackName][leastFilled].push(logicalId);

    if (dependsOnLogicalId) {
      let dependsOn = [dependsOnLogicalId];

      if (resource.DependsOn) {
        dependsOn = dependsOn.concat(resource.DependsOn);
      }

      resource.DependsOn = dependsOn;
    }
  }
};
