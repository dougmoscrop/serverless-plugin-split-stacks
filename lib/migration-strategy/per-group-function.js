'use strict';

const crypto = require('crypto');

const PerFunction = require('./per-function');

class PerGroupFunction extends PerFunction {

  constructor(plugin) {
    super(plugin);

    if (plugin.config.perGroupFunction) {
      if (
        !plugin.config.nestedStackCount
        || typeof plugin.config.nestedStackCount !== 'number'
        || !Number.isInteger(plugin.config.nestedStackCount)
        || plugin.config.nestedStackCount < 2
      ) {
        throw Error('nestedStackCount configuration must be an integer greater than 2');
      }

      // Super class will not call them as we don't use the same configuration here
      this.apiGatewayResourceMap = this.getApiGatewayResourceMap(plugin.serverless);
      this.lambdaNames = this.getAllNormalizedLambdaNames(plugin.serverless);

      this.nestedStackCount = plugin.config.nestedStackCount;
      this.resourceParallelDeployments = 1;
      this.lambdaStacks = {};

      if (
        plugin.config.resourceParallelDeployments
        && typeof plugin.config.resourceParallelDeployments === 'number'
        && Number.isInteger(plugin.config.resourceParallelDeployments)
        && plugin.config.resourceParallelDeployments > 0
      ) {
        this.resourceParallelDeployments = plugin.config.resourceParallelDeployments;
      }
    }
  }


  migration(resource, logicalId) {
    if (this.plugin.config.perGroupFunction) {
      const destination = this.getDestination(resource, logicalId);

      if (destination) {
        return {destination};
      }
    }
  }

  getDestination(resource, logicalId) {
    let normalizedLambdaName;

    if (['AWS::ApiGateway::Method', 'AWS::ApiGateway::Resource'].indexOf(resource.Type) !== -1) {
      normalizedLambdaName = this.getApiGatewayDestination(logicalId);
    } else {
      normalizedLambdaName = this.getLambdaDestination(logicalId);
    }

    if (normalizedLambdaName) {
      this.setDependsOn(resource, logicalId, normalizedLambdaName);
      return this.getNestedStackName(normalizedLambdaName);
    }
  }

  setDependsOn(resource, logicalId, normalizedLambdaName) {
    // Lambda already depends on LogGroups, we don't want to create Circular dependencies
    if (resource.Type === 'AWS::Logs::LogGroup') {
      return;
    }

    const nestedStackName = this.getNestedStackName(normalizedLambdaName);
    let dependsOnLogicalId;

    if (!this.lambdaStacks[nestedStackName]) {
      this.lambdaStacks[nestedStackName] = new Array(this.resourceParallelDeployments)
        .fill([], 0, this.resourceParallelDeployments);
    }

    const leastFilled = this.lambdaStacks[nestedStackName].reduce(
      (accumulator, item) => accumulator + item.length,
      0
    ) % this.resourceParallelDeployments;

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

  getNestedStackName(normalizedLambdaName) {
    const hash = crypto.createHash('sha1').update(normalizedLambdaName).digest('hex');

    return String(Number.parseInt(hash.substring(0,10), 16) % this.nestedStackCount + 1);
  }
}

module.exports = PerGroupFunction;
