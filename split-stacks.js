'use strict';

const _ = require('lodash');
const semver = require('semver');

const setDeploymentBucketEndpoint = require('./lib/deployment-bucket-endpoint');
const migrateExistingResources = require('./lib/migrate-existing-resources');
const migrateNewResources = require('./lib/migrate-new-resources');
const replaceReferences = require('./lib/replace-references');
const replaceConditions = require('./lib/replace-conditions');
const replaceOutputs = require('./lib/replace-outputs');
const mergeStackResources = require('./lib/merge-stack-resources');
const sequenceStacks = require('./lib/sequence-stacks');
const writeNestedStacks = require('./lib/write-nested-stacks');
const logSummary = require('./lib/log-summary');

const utils = require('./lib/utils');

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
      { setDeploymentBucketEndpoint },
      { migrateExistingResources },
      { migrateNewResources },
      { replaceReferences },
      { replaceConditions },
      { replaceOutputs },
      { mergeStackResources },
      { sequenceStacks },
      { writeNestedStacks },
      { logSummary }
    );

    const custom = this.serverless.service.custom || {};

    this.config = custom.splitStacks || {};
    this.stacksMap = ServerlessPluginSplitStacks.stacksMap;
  }

  split() {
    this.rootTemplate = this.serverless.service.provider.compiledCloudFormationTemplate;
    this.resourcesById = Object.assign({}, this.rootTemplate.Resources);

    this.resourceMigrations = {};

    return Promise.resolve()
      .then(() => this.setDeploymentBucketEndpoint())
      .then(() => this.migrateExistingResources())
      .then(() => this.migrateNewResources())
      .then(() => this.replaceReferences())
      .then(() => this.replaceOutputs())
      .then(() => this.replaceConditions())
      .then(() => this.mergeStackResources())
      .then(() => this.sequenceStacks())
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

module.exports = ServerlessPluginSplitStacks;
module.exports.stacksMap = {}; // legacy, will be removed
