'use strict';

const path = require('path');
const _ = require('lodash');
const semver = require('semver');

const stacksMap = require('./lib/stacks-map');
const migrateExistingResources = require('./lib/migrate-existing-resources');
const migrateNewResources = require('./lib/migrate-new-resources');
const replaceReferences = require('./lib/replace-references');
const replaceOutputs = require('./lib/replace-outputs');
const mergeStackResources = require('./lib/merge-stack-resources');
const writeNestedStacks = require('./lib/write-nested-stacks');
const logSummary = require('./lib/log-summary');

const utils = require('./lib/utils');

const supportedModes = new Set(['resourceType', 'lambda']);
const resolveMode = mode => {
	if (mode == null) return 'resourceType';
	mode = String(mode);
	if (supportedModes.has(mode)) return mode;
	throw new Error(`Unsupported Split Stacks mode: ${ mode }`);
};

class ServerlessPluginSplitStacks {

  constructor(serverless, options) {
    if (!semver.satisfies(serverless.version, '>= 1.13')) {
      throw new Error('serverless-plugin-split-stacks requires serverless 1.13 or higher!');
    }

    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aws');
    this.hooks = {
      'after:aws:package:finalize:mergeCustomProviderResources': this.split.bind(this),
      'aws:deploy:deploy:uploadArtifacts': this.upload.bind(this)
    };

    Object.assign(this,
      utils,
      { migrateExistingResources },
      { migrateNewResources },
      { replaceReferences },
      { replaceOutputs },
      { mergeStackResources },
      { writeNestedStacks },
      { logSummary }
    );

		const config = (this.serverless.service.custom || {}).splitStacks || {};
		const mode = resolveMode(config.mode);
		if (mode === 'lambda') require('./customizations/stack-per-lambda');

    // Load eventual stacks map customizations
    const customizationsPath = path.resolve(serverless.config.servicePath, 'stacks-map.js');
    try {
      require(customizationsPath)
    } catch (e) {
      // If module not found ignore, otherwise crash
      if (e.code !== 'MODULE_NOT_FOUND' || !e.message.endsWith(`'${customizationsPath}'`)) {
        throw e;
      }
    }
  }

  static resolveMigration(resource) {
    return this.stacksMap[resource.Type];
  }

  split() {
    this.rootTemplate = this.serverless.service.provider.compiledCloudFormationTemplate;
    this.resourcesById = Object.assign({}, this.rootTemplate.Resources);

    this.resourceMigrations = {};

    return Promise.resolve()
      .then(() => this.migrateExistingResources())
      .then(() => this.migrateNewResources())
      .then(() => this.replaceReferences())
      .then(() => this.replaceOutputs())
      .then(() => this.mergeStackResources())
      .then(() => this.writeNestedStacks())
      .then(() => this.logSummary());
  }

  upload() {
    const deploymentBucketObject = this.serverless.service.provider.deploymentBucketObject;

    return this.provider.getServerlessDeploymentBucketName(this.options.stage, this.options.region)
      .then(deploymentBucket => {
        const files = this.getNestedStackFiles();

        return Promise.all(_.map(files, file => {
          const params = {
            Bucket: deploymentBucket,
            Key: file.key,
            Body: file.createReadStream(),
            ContentType: 'application/json',
          };

          if (deploymentBucketObject) {
            const encryptionParams = this.getEncryptionParams(deploymentBucketObject);
            Object.assign(params, encryptionParams);
          }

          return this.provider.request('S3', 'putObject', params);
        }));
      });
  }
}

ServerlessPluginSplitStacks.stacksMap = stacksMap;

module.exports = ServerlessPluginSplitStacks;
