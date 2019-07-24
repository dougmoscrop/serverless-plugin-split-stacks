'use strict';

const BaseStrategy = require('./base-strategy');

module.exports = class PerFunction extends BaseStrategy {

  constructor(plugin) {
    super(plugin);

    if (this.isStrategyActive()) {
      this.apiGatewayResourceMap = this.getApiGatewayResourceMap(plugin.serverless);
      this.lambdaNames = this.getAllNormalizedLambdaNames(plugin.serverless);
    }
  }

  getApiGatewayDestination(logicalId) {
    return this.apiGatewayResourceMap.get(logicalId);
  }

  getLambdaDestination(logicalId) {
    // TODO: this could probably use a trie structure
    return this.lambdaNames.find(normalizedLambdaName => {
      return logicalId.startsWith(normalizedLambdaName);
    });
  }

  getAllNormalizedLambdaNames(serverless) {
    // (it's the Serverless internal convention to prefix most lambda specific resources
    // with normalized lambda name)
    return Object.keys(serverless.service.functions)
      .map(lambdaName => this.plugin.provider.naming.getNormalizedFunctionName(lambdaName))
      .sort((normalizedName1, normalizedName2) => normalizedName2.length - normalizedName1.length);
  }

  getApiGatewayResourceMap(serverless) {
    // AwsCompileApigEvents plugin provides access to data maps and methods
    // that allow to easily map generated resources to lambdas
    const apiGatewayPlugin = serverless.pluginManager.plugins.find(
      plugin => plugin.constructor.name === 'AwsCompileApigEvents'
    );

    // Result map: resource id to normalized function name
    const resourceMap = new Map();

    // Temporary map that helps to detect how many functions depend on given resource.
    // If there's more than one function then we keep the resource in main stack.
    const resourceLambdasMap = new Map();

    // Iterate over all configured HTTP endpoints
    apiGatewayPlugin.validated.events.forEach(({ functionName, http }) => {
      // Normalized function name makes part of resource logical id
      const normalizedLambdaName = this.plugin.provider.naming.getNormalizedFunctionName(functionName);

      // AWS::ApiGateway::Method can be deducted directly as it's always mapped to single function
      resourceMap.set(
        this.plugin.provider.naming.getMethodLogicalId(
          apiGatewayPlugin.getResourceName(http.path),
          http.method
        ),
        normalizedLambdaName
      );
      // Ensure to support also OPTIONS method (mandatory for CORS support)
      const resourceName = this.plugin.provider.naming.getMethodLogicalId(
        apiGatewayPlugin.getResourceName(http.path),
        'OPTIONS'
      );
      if (!resourceLambdasMap.has(resourceName)) resourceLambdasMap.set(resourceName, new Set());
      resourceLambdasMap.get(resourceName).add(normalizedLambdaName);

      // Collect information about all AWS::ApiGateway::Resource resources that are needed for
      // this endpoint
      const tokens = [];
      http.path.split('/').forEach(token => {
        tokens.push(token);
        const resourceName = this.plugin.provider.naming.getResourceLogicalId(tokens.join('/'));
        if (!resourceLambdasMap.has(resourceName)) {
          resourceLambdasMap.set(resourceName, new Set());
        }
        resourceLambdasMap.get(resourceName).add(normalizedLambdaName);
      });
    });

    // Resolve all AWS::ApiGateway::Resource that map single function, only those will be moved to
    // nested per lambda distributed stacks
    resourceLambdasMap.forEach((normalizedFunctionNames, resourceName) => {
      if (normalizedFunctionNames.size > 1) return;
      resourceMap.set(resourceName, normalizedFunctionNames.values().next().value);
    });

    return resourceMap;
  }

  // overloaded
  getDestination(resource, logicalId) {
    let normalizedLambdaName;

    if (['AWS::ApiGateway::Method', 'AWS::ApiGateway::Resource'].indexOf(resource.Type) !== -1) {
      normalizedLambdaName = this.getApiGatewayDestination(logicalId);
    } else {
      normalizedLambdaName = this.getLambdaDestination(logicalId);
    }

    if (normalizedLambdaName) {
      return {
        destination: this.getNestedStackName(normalizedLambdaName)
      };
    }
  }

  // overloaded
  isStrategyActive() {
    return this.plugin.config.perFunction;
  }

  // Can be overloaded
  getNestedStackName(normalizedLambdaName) {
    return normalizedLambdaName;
  }
};

