'use strict';

const _ = require('lodash');

module.exports = function replaceReferences() {
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
          const parameter =
            resourceMigration.parameterize(dependency.getDependencyName(), dependency.value);

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
