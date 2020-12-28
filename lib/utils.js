'use strict';

const path = require('path');
const fs = require('fs');

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

function varStringToMappings(varString) {
  const re = /\${(!?[a-zA-Z0-9.]+)}/g;
  let match;
  let s = varString;
  let mappings = {};

  while ((match = re.exec(varString)) !== null) {
    const [fullMatch, group] = match;
    if (group.startsWith('!')) {
      // escape character
      s = s.replace(fullMatch, `\${${group.substring(1)}}`);
    } else if (group.includes('.')) {
      // GetAtt
      const varName = group.replace('.', '_');
      mappings[varName] = {'Fn::GetAtt': group.split('.')};
      s = s.replace(fullMatch, `\${${varName}}`);
    } else {
      // Ref
      mappings[group] = {'Ref': group};
    }
  }

  return {varString: s, mappings};
}

module.exports = {

  log(msg) {
    this.serverless.cli.log(`[serverless-plugin-split-stacks]: ${msg}`);
  },

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

  getFileName(stackName) {
    const adjusted = stackName
      .replace('NestedStack', '-nested-stack')
      .replace(/nested-stack([0-9]+)$/, 'nested-stack-$1');

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

  nestedStackResource(stackName) {
    const fileName = this.getFileName(stackName);

    this.nestedStackResources = this.nestedStackResources || {};
    this.nestedStackResources[stackName] = this.nestedStackResources[stackName] || {
       Type: 'AWS::CloudFormation::Stack',
       Properties: {
         Parameters: {},
         TemplateURL: {
           'Fn::Join': [
             '/', [
               `https://${this.deploymentBucketEndpoint}`,
               this.serverless.service.provider.deploymentBucket || { Ref: 'ServerlessDeploymentBucket' },
               this.serverless.service.package.artifactDirectoryName,
               fileName
             ]
           ]
         }
       }
     };

     return this.nestedStackResources[stackName];
  },

  migrate(logicalId, stackName, force = false) {
    const rootResources = this.rootTemplate.Resources;
    const resource = rootResources[logicalId];

    if (resource === undefined || resource === null) {
      throw new Error(`Missing resource: ${logicalId}`);
    }

    if (logicalId in this.resourceMigrations) {
      if (force) {
        const { stack } = this.resourceMigrations[logicalId];
        delete stack.Resources[logicalId];
        delete this.resourceMigrations[logicalId];
      } else {
        throw new Error(`${logicalId} was already migrated`);
      }
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

  getStackNameBase(destination) {
    return `${destination}NestedStack`;
  },

  getStackName(destination, allowSuffix) {
    let stackNameBase = this.getStackNameBase(destination);
    let stackName;
    let suffix = '';

    while (stackName === undefined) {
      const potentialStackName = `${stackNameBase}${suffix}`;
      const stack = this.nestedStack(potentialStackName);

      if (this.stackHasRoom(stack)) {
        stackName = potentialStackName;
      } else {
        if (allowSuffix) {
          if (suffix) {
            suffix = Number(suffix) + 1
          } else {
            suffix = 2;
          }
        } else {
          throw new Error(`Destination stack ${destination} is already full!`);
        }
      }
    }

    return stackName;
  },

  stackHasRoom(stack) {
    const { outputLimit = 200, parameterLimit = 200, resourceLimit = 500 } = this.config || {};
    const resources = stack.Resources || {};
    const outputs = stack.Outputs || {};

    const referenceCount = Object.values(resources).reduce(
      (prev, resource) => prev + this.getReferencedResources(resource).length,
      0
    );

    return (
      Object.keys(resources).length < resourceLimit &&
      Object.keys(outputs).length < outputLimit &&
      referenceCount < parameterLimit
    );
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
        const Sub = currentValue['Fn::Sub'];

        if (Ref && Ref in this.resourcesById) {
          references.push(new Reference(Ref, _.cloneDeep(current)));
        } else if (GetAtt) {
          const id = typeof GetAtt === 'string' ? GetAtt.split('.', 1)[0] : GetAtt[0];

          if (id in this.resourcesById) {
            references.push(new Reference(id, _.cloneDeep(current)));
          }
        } else if (Array.isArray(Join)) {
          todo.push({
            value: Join[1],
            parent: Join,
            key: 1
          });
        } else if (Sub) {
          // dictionary of form {[VarName: string]: VarValue}
          let mappings;

          if (typeof Sub === 'string') {
            // Fn::Sub without a Mapping, convert to version with mapping
            // (Reference requires a parent with a replaceable key which is not possible for the string version)
            let varString = Sub;
            ({varString, mappings} = varStringToMappings(varString));
            currentValue['Fn::Sub'] = [varString, mappings];
          } else {
            // Fn::Sub with a Mapping, Sub has format [StringWithVars, MappingDict]
            mappings = Sub[1];
          }

          todo.push({
            value: mappings,
            parent: currentValue['Fn::Sub'],
            key: 1,
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
  },

  getNestedStackFiles() {
    const serverlessDirPath = path.join(this.serverless.config.servicePath, '.serverless');
    const artifactDirectory = this.serverless.service.package.artifactDirectoryName;

    return fs.readdirSync(serverlessDirPath)
      .filter(filename => filename.match(/nested-stack(-[0-9]+)?\.json$/))
      .map(filename => {
        return {
          key: `${artifactDirectory}/${filename}`,
          createReadStream: () => fs.createReadStream(path.join(serverlessDirPath, filename))
        };
      })
  },

  getStackSummary(stackName) {
    const stackSummary = [];

    function backoff(attempt) {
      const limit = 10;
      const delay = 200;

      if (attempt < limit) {
        return new Promise(resolve => {
          const timeout = Math.round(Math.random() * delay * Math.pow(2, attempt));
          setTimeout(resolve, timeout);
        });
      }
      return Promise.reject('Retry limit exceeded');
    }

    let attempt = 0;

    function listStackResources(provider, StackName, NextToken) {
      return provider.request('CloudFormation', 'listStackResources', {
        StackName,
        NextToken
      })
      .then(response => {
        stackSummary.push.apply(stackSummary, response.StackResourceSummaries);

        if (response.NextToken) {
          return listStackResources(provider, StackName, response.NextToken);
        }
      })
      .catch(e => {
        if (e.message === 'Rate exceeded') {
          return backoff(attempt++)
            .then(() => {
              return listStackResources(provider, StackName, NextToken);
            });
        }
        throw e;
      });
    }

    return listStackResources(this.provider, stackName)
      .then(() => {
        return stackSummary;
      });
  },

  getEncryptionParams(deploymentBucketObject) {
    const encryptionFields = [
      ['serverSideEncryption', 'ServerSideEncryption'],
      ['sseCustomerAlgorithim', 'SSECustomerAlgorithm'],
      ['sseCustomerKey', 'SSECustomerKey'],
      ['sseCustomerKeyMD5', 'SSECustomerKeyMD5'],
      ['sseKMSKeyId', 'SSEKMSKeyId'],
    ];

    return encryptionFields.reduce((memo, element) => {
      if (deploymentBucketObject[element[0]]) {
        memo[element[1]] = deploymentBucketObject[element[0]];
      }
      return memo;
    }, {});
  }

};
