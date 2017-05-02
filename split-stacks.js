'use strict';

const path = require('path');

const _ = require('lodash');

const migrations = require('./lib/migrations');
const utils = require('./lib/utils');

module.exports = class StackSplitter {

  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aws');
    this.hooks = {
      'after:aws:package:finalize:mergeCustomProviderResources': this.split.bind(this),
      'aws:deploy:deploy:uploadArtifacts': this.upload.bind(this)
    };

    Object.assign(this, { migrations }, utils);

    this.log = msg => this.serverless.cli.log(`[serverless-plugin-split-stacks]: ${msg}`);
  }

  split() {
    this.rootTemplate = this.serverless.service.provider.compiledCloudFormationTemplate;
    this.resourceMigrations = {};
    this.resourcesById = Object.assign({}, this.rootTemplate.Resources);

    return Promise.resolve()
      .then(() => this.groupResourcesByType())
      .then(() => this.migrateResources())
      .then(() => this.replaceReferences())
      .then(() => this.replaceOutputs())
      .then(() => this.mergeStackResources())
      .then(() => this.writeNestedStacks())
      .then(() => this.logSummary());
  }

  groupResourcesByType() {
    this.resourcesByType = _.reduce(this.resourcesById, (memo, resource, id) => {
      const type = resource.Type;

      memo[type] = memo[type] || {};
      memo[type][id] = resource;

      return memo;
    }, {});
  }

  migrateResources() {
    _.each(this.migrations, (migration) => migration.call(this));
  }

  replaceReferences() {
    _.each(this.resourcesById, (resource, resourceId) => {
      const references = this.getReferencedResources(resource);

      if (resource.DependsOn) {
        resource.DependsOn = [].concat(resource.DependsOn);
      } else {
        resource.DependsOn = [];
      }

      _.each(references, dependency => {
        this.reconcile(resourceId, dependency.id, {
          ResourceMigrated: (resourceMigration) => {
            const parameter = resourceMigration.parameterize(dependency.id, dependency.value);

            dependency.replace(parameter);

            this.depends(resourceMigration.stackResource, dependency.id);
          },
          DependencyMigrated: (dependencyMigration) => {
            const output = this.nestedOutput(dependency, dependencyMigration);

            dependency.replace(output);

            this.depends(resource, dependencyMigration.stackName);
          },
          ResourceAndDependencyMigrated: (resourceMigration, dependencyMigration) => {
            const output = this.nestedOutput(dependency, dependencyMigration);
            const dependencyName = dependency.getDependencyName();
            const parameter = resourceMigration.parameterize(dependencyName, output);

            dependency.replace(parameter);

            this.depends(resourceMigration.stackResource, dependencyMigration.stackName);
          }
        });
      });

      _.each(resource.DependsOn, (dependency) => {
        this.reconcile(resourceId, dependency, {
          DependencyMigrated: (dependencyMigration) => {
            this.depends(resource, dependencyMigration.stackName);
            resource.DependsOn = _.without(resource.DependsOn, dependency);
          },
          ResourceMigrated: (resourceMigration) => {
            this.depends(resourceMigration.stackResource, dependency)
            resource.DependsOn = _.without(resource.DependsOn, dependency);
          },
          ResourceAndDependencyMigrated: (resourceMigration, dependencyMigration) => {
            this.depends(resourceMigration.stackResource, dependencyMigration.stackName);
            resource.DependsOn = _.without(resource.DependsOn, dependency);
          }
        });
      });

      resource.DependsOn = _.uniq(resource.DependsOn, _.isUndefined);
    });
  }

  replaceOutputs() {
    const references = this.getReferencedResources(this.rootTemplate.Outputs);

    _.each(references, reference => {
      if (reference.id in this.resourceMigrations) {
        const newValue = this.nestedOutput(reference, this.resourceMigrations[reference.id]);
        reference.replace(newValue);
      }
    });
  }

  mergeStackResources() {
    if (this.resourceMigrations) {
      _.each(this.resourceMigrations, migration => {
        delete this.rootTemplate.Resources[migration.logicalId];
        this.rootTemplate.Resources[migration.stackName] = migration.stackResource;
      });
    }
  }

  writeNestedStacks() {
    if (this.nestedStacks) {
      _.each(this.nestedStacks, (stack, stackName) => {
        const fileName = this.getFileName(stackName);
        const destination = path.join(
         this.serverless.config.servicePath,
         '.serverless',
         fileName
       );

       this.serverless.utils.writeFileSync(destination, stack);
     });
   }
  }

  logSummary() {
    if (this.nestedStacks) {
      const before = Object.keys(this.resourcesById).length;
      const after = Object.keys(this.rootTemplate.Resources).length;
      const stacks = Object.keys(this.nestedStacks).length;

      this.log(`Summary: ${(stacks + before) - after} resources migrated in to ${stacks} nested stacks`);
    }
  }

  upload() {
    // TODO: read these from the file system?
    if (this.nestedStackResources) {
      return this.getBucketName()
        .then((bucket) => {
          return _.map(this.nestedStackResources, (resource, stackName) => {
            const key = this.getS3Key(stackName);

            const params = {
              Bucket: bucket,
              Key: key,
              Body: JSON.stringify(this.nestedStacks[stackName]),
              ContentType: 'application/json',
            };

            return this.provider.request('S3', 'putObject',
              params,
              this.options.stage,
              this.options.region);
          });
        });
    }
  }
};
