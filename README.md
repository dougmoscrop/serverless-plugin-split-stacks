[![CircleCI](https://circleci.com/gh/dougmoscrop/serverless-plugin-split-stacks.svg?style=svg)](https://circleci.com/gh/dougmoscrop/serverless-plugin-split-stacks)

# serverless-plugin-split-stacks

The goal if this plugin is to split some resources off in to nested stacks to work around the 200 CloudFormation resource limit.

It exposes two modes described below, and additionally exposes further ends if eventual customizations are needed.

## Predefined split modes

### Stack per resource type (default)

__Note: This mode currently migrates the `RestApi` resource to a nested stack, which causes your URL to change.__

Migrating resources to nested stacks is tricky because some plugins rely on querying the resource from the main stack and would need to understand this. There are also plenty of issues with moving resources in existing deployments (you frequently get 'resource already exists' errors). Because of this, this mode is very conservative. It moves only resources of types that seem to be easy to move.

This mode is turned on by default, as it doesn't require _reset_ of stack, when migrating from default serverless way of handling resources.

### Stack per lambda

__Note: Switching to nested stack per lambda approach will most likely require complete removal of a stage (stack) and a new deployment with this configuration in. It's due to fact that CloudFormation (at this point) doesn't support move of resources between stacks.__

Having this mode in was an initial goal for the project, still due to limited capabitilies of CloudFormation in how resources can be moved among stacks, it's not set as the default.
Additionally due to vast list of possible resource to lambda combinations, this mode still is seen as _experimental_ and demands further testing (altough it was already confirmed to work well with various sophisticated setups)

Turn on this mode in your `serverless.yml` as:

```yaml
custom:
  splitStacks:
    mode: 'lambda'
```

## Further customizations of stack mappings

__Default stacks migrations map is configured at plugin's constructor `stacksMap` property, and it's default configuration can be seen in [lib/stacks-map.js](https://github.com/dougmoscrop/serverless-plugin-split-stacks/blob/master/lib/stacks-map.js)__

This map can be manually customized. To do so, introduce the `stacks-map.js` module in a root folder of your project (this module if exists will be transparently loaded by the plugin).

Example of customization, that moves DynamoDB resources to nested stack:

```javascript
const stacksMap = require('serverless-plugin-split-stacks').stacksMap

stacksMap['AWS::DynamoDB::Table'] = { destination: 'Dynamodb' };
```

If ability to customize _static_ stacks map is not enough, then it's possible to
customize the `resolveMigration` function, one that resolves migration configuration on basis of each resource:

```javascript
const ServerlessPluginSplitStacks = require('serverless-plugin-split-stacks');

ServerlessPluginSplitStacks.resolveMigration = function (resource, logicalId, serverless) {
  if (logicalId.startsWith("Foo")) return { destination: 'Foo' };

  // Fallback to default:
  return this.stacksMap[resource.Type];
};
```

__Be careful when introducing any customizations to default config. Many kind of resources (as e.g. DynamoDB tables) cannot be freely moved between CloudFormation stacks (that can only be achieved via full removal and recreation of the stage)__

## Limitations

You should try to limit the number of functions you have in your service to 20 or so. This plugin is not a substitute for fine-grained services - but even with a domain of a single entity and sub-entity, CRUD operations on each and some stream listeners its easy to exceed 200 resources once monitoring is in place.
