"use strict";

const { resolve } = require("path");
const test = require("ava");

const StackSplitter = require("../split-stacks");

const modesConfPath = resolve(__dirname, "../customizations");
const modePaths = new Map([["lambda", resolve(modesConfPath, "stack-per-lambda.js")]]);

test("resourceType", t => {
	const serverless = {
		version: "1.13.2",
		getProvider: () => t.context.provider,
		config: {
			servicePath: __dirname
		},
		pluginManager: {
			plugins: [{ constructor: { name: "AwsCompileApigEvents" }, validated: { events: [] } }]
		},
		service: { custom: { splitStacks: {} } }
	};

	new StackSplitter(serverless);
	t.false(Boolean(require.cache[modePaths.get("lambda")]));
});

test("lambda", t => {
	const serverless = {
		version: "1.13.2",
		getProvider: () => t.context.provider,
		config: {
			servicePath: __dirname
		},
		pluginManager: {
			plugins: [{ constructor: { name: "AwsCompileApigEvents" }, validated: { events: [] } }]
		},
		service: { custom: { splitStacks: { mode: "lambda" } } }
	};

	new StackSplitter(serverless);
	t.true(Boolean(require.cache[modePaths.get("lambda")]));
});
