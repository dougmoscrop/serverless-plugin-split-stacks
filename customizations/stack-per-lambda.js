"use strict";

const namingUtils = require("serverless/lib/plugins/aws/lib/naming");

// Basic memoization util for internal needs
const memoize = fn => {
	let cached;
	return (...args) => (cached ? cached : (cached = fn(...args)));
};

const getApiGatewayResourceMap = memoize(serverless => {
	// AwsCompileApigEvents plugin provides access to data maps and methods
	// that allow to easily map generated resources to lambdas
	const apiGatewayPlugin = serverless.pluginManager.plugins.find(
		plugin => plugin.constructor.name === "AwsCompileApigEvents"
	);

	// Result map: resource id to normalized function name
	const resourceMap = new Map();

	// Temporary map that helps to detect how many functions depend on given AWS::ApiGateway::Resource
	// resources. It can be the case that more than one function depends on one resouce, in such case
	// we keep resource in the main stack
	const gatewayResourceLambdaMap = new Map();

	// Iterate over all configured HTTP endpoints
	apiGatewayPlugin.validated.events.map(({ functionName, http }) => {
		// Normalized function name makes part of resource logical id
		const normalizedLambdaName = namingUtils.getNormalizedFunctionName(functionName);

		// AWS::ApiGateway::Method can be deducted directly as it's always mapped to single function
		resourceMap.set(
			namingUtils.getMethodLogicalId(
				apiGatewayPlugin.getResourceName(http.path),
				http.method
			),
			normalizedLambdaName
		);
		// Ensure to support also OPTIONS method (mandatory for CORS support)
		resourceMap.set(
			namingUtils.getMethodLogicalId(apiGatewayPlugin.getResourceName(http.path), "OPTIONS"),
			normalizedLambdaName
		);

		// Collect information about all AWS::ApiGateway::Resource resources that are needed for
		// this endpoint
		const tokens = [];
		http.path.split("/").forEach(token => {
			tokens.push(token);
			const resourceName = namingUtils.getResourceLogicalId(tokens.join("/"));
			if (!gatewayResourceLambdaMap.has(resourceName)) {
				gatewayResourceLambdaMap.set(resourceName, new Set());
			}
			gatewayResourceLambdaMap.get(resourceName).add(normalizedLambdaName);
		});
	});

	// Resolve all AWS::ApiGateway::Resource that map single function, only those will be moved to
	// nested per lambda distributed stacks
	gatewayResourceLambdaMap.forEach((normalizedFunctionNames, resourceName) => {
		if (normalizedFunctionNames.size > 1) return;
		resourceMap.set(resourceName, normalizedFunctionNames.values().next().value);
	});
	return resourceMap;
});

const getAllNormalizedLambdaNames = memoize(serverless =>
	Object.keys(serverless.service.functions)
		.map(lambdaName => namingUtils.getNormalizedFunctionName(lambdaName))
		.sort((normalizedName1, normalizedName2) => normalizedName2.length - normalizedName1.length)
);

const resolveMigration = (resource, logicalId, serverless) => {
	let destination;
	switch (resource.Type) {
		case "AWS::ApiGateway::Method":
		case "AWS::ApiGateway::Resource":
			destination = getApiGatewayResourceMap(serverless).get(logicalId);
			break;
		default:
			// All other resource types if their name starts with one of the lambda names
			// are propagated to given lambda stack
			// (it's the Serverless internal convention to prefix most lambda specific resources
			// with normalized lambda name)
			destination = getAllNormalizedLambdaNames(serverless).find(normalizedLambdaName =>
				logicalId.startsWith(normalizedLambdaName)
			);
	}
	return destination ? { destination } : null;
};

module.exports = resolveMigration;
require("../").resolveMigration = resolveMigration;
