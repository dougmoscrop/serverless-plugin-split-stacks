'use strict';

const _ = require('lodash');

const Reference = require('./reference');
const Migration = require('./migration');

function toArray(thing) {
  if (Array.isArray(thing)) {
    return thing;
  } else if (thing === undefined || thing === null) {
    return [];
  } else {
    return [thing];
  }
}

module.exports = {

  depends(resource, dependency) {
    resource.DependsOn = _.union(toArray(resource.DependsOn), toArray(dependency));
  },

  getLogicalId(value) {
    if (value) {
      if (typeof value === 'string') {
        return value;
      } else if (typeof value === 'object') {
        if ('Ref' in value) {
          return value.Ref;
        } else if ('Fn::GetAtt' in value) {
          return value['Fn::GetAtt'][0];
        }
      }
    }

    throw new Error('Unknown value: ' + value);
  },

  getBucketName() {
    return this.provider.getServerlessDeploymentBucketName(this.options.stage, this.options.region)
  },

  getFileName(stackName) {
    const adjusted = stackName.replace('NestedStack', '-nested-stack');
    return `cloudformation-template-${adjusted}.json`;
  },

  nestedOutput(reference, migration) {
    const name = reference.getDependencyName();
    const stack = migration.stack;

    stack.Outputs[name] = stack.Outputs[name] || {
      Value: reference.value
    };

    return { 'Fn::GetAtt': [migration.stackName, `Outputs.${name}`] };
  },

  nestedStack(stackName) {
    this.nestedStacks = this.nestedStacks || {};
    this.nestedStacks[stackName] = this.nestedStacks[stackName] || {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: `${stackName} nested stack`,
      Parameters: {},
      Resources: {},
      Outputs: {}
    };

    return this.nestedStacks[stackName];
  },

  getS3Key(stackName) {
    const fileName = this.getFileName(stackName);
    return `${this.serverless.service.package.artifactDirectoryName}/${fileName}`;
  },

  nestedStackResource(stackName) {
    const s3Key = this.getS3Key(stackName);

    this.nestedStackResources = this.nestedStackResources || {};
    this.nestedStackResources[stackName] = this.nestedStackResources[stackName] || {
       Type: 'AWS::CloudFormation::Stack',
       Properties: {
         Parameters: {},
         TemplateURL: {
           'Fn::Join': [
             '/', [
               'https://s3.amazonaws.com',
               {
                 Ref: 'ServerlessDeploymentBucket'
               },
               s3Key
             ]
           ]
         }
       }
     };

     return this.nestedStackResources[stackName];
  },

  migrate(logicalId, destination) {
    const stackName = `${destination}NestedStack`;

    if (logicalId in this.resourceMigrations) {
      const migration = this.resourceMigrations[logicalId];

      if (migration.stackName === stackName) {
        return
      }

      throw new Error('Trying to migrate already migrated resource to a different place!');
    }

    const rootResources = this.rootTemplate.Resources;
    const resource = rootResources[logicalId];

    if (resource === undefined || resource === null) {
      throw new Error(`Missing resource: ${logicalId}`);
    }

    const stack = this.nestedStack(stackName);
    const stackResource = this.nestedStackResource(stackName);

    stack.Resources[logicalId] = resource;

    this.resourceMigrations[logicalId] = new Migration({
      logicalId,
      resource,
      stackName,
      stack,
      stackResource
    });
  },

  getReferencedResources(start) {
    const references = [];

    const todo = [{
      value: start
    }];

    while (todo.length) {
      const current = todo.pop();
      const currentValue = current.value;

      if (!currentValue) {
        continue;
      }

      if (Array.isArray(currentValue)) {
        _.each(currentValue, (element, i) => {
          todo.push({
            value: element,
            parent: currentValue,
            key: i
          });
        });
      } else if (typeof currentValue === 'string') {
        if (currentValue in this.resourcesById) {
          references.push(new Reference(currentValue, current));
        }
      } else if (typeof currentValue === 'object') {
        // each intrinsic has special handling
        const Ref = currentValue.Ref;
        const GetAtt = currentValue['Fn::GetAtt'];
        const Join = currentValue['Fn::Join'];

        if (Ref && Ref in this.resourcesById) {
          references.push(new Reference(Ref, current));
        } else if (Array.isArray(GetAtt)) {
          const id = GetAtt[0];

          if (id in this.resourcesById) {
            references.push(new Reference(id, current));
          }
        } else if (Array.isArray(Join)) {
          todo.push({
            value: Join[1],
            parent: Join,
            key: 1
          });
        } else {
          _.each(currentValue, (nextValue, nextKey) => {
            if (nextKey === 'DependsOn') {
              return; // handled separately
            }

            todo.push({
              value: nextValue,
              parent: currentValue,
              key: nextKey
            });
          });
        }
      }
    }

    return references;
  },

  reconcile(resourceId, dependencyId, handlers) {
    const resourceMigration = this.resourceMigrations[resourceId];
    const dependencyMigration = this.resourceMigrations[dependencyId];

    if (resourceMigration) {
      if (dependencyMigration) {
        if (resourceMigration.stackName !== dependencyMigration.stackName) {
          return handlers.ResourceAndDependencyMigrated(resourceMigration, dependencyMigration);
        }
      } else {
        return handlers.ResourceMigrated(resourceMigration);
      }
    } else if (dependencyMigration) {
      return handlers.DependencyMigrated(dependencyMigration);
    }
  }

};
