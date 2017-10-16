'use strict';

const path = require('path');
const _ = require('lodash');
const semver = require('semver');

const migrateExistingResources = require('./lib/migrate-existing-resources');
const migrateNewResources = require('./lib/migrate-new-resources');
const replaceReferences = require('./lib/replace-references');
const replaceOutputs = require('./lib/replace-outputs');
const mergeStackResources = require('./lib/merge-stack-resources');
const writeNestedStacks = require('./lib/write-nested-stacks');
const logSummary = require('./lib/log-summary');

const utils = require('./lib/utils');

module.exports = class StackSplitter {

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

          return this.provider.request('S3', 'putObject',
            params,
            this.options.stage,
            this.options.region);
        }));
      });
  }
};
