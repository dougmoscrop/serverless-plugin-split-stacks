[![CircleCI](https://circleci.com/gh/dougmoscrop/serverless-plugin-split-stacks.svg?style=svg)](https://circleci.com/gh/dougmoscrop/serverless-plugin-split-stacks)

# serverless-plugin-split-stacks

This plugin migrates CloudFormation resources in to nested stacks in order to work around the 200 resource limit.

There are built-in migration strategies that can be turned on or off as well as defining your own custom migrations. It is a good idea to select the best strategy for your needs from the start because the only reliable method of changing strategy later on is to recreate the deployment from scratch. You configure this in your `serverless.yml` (defaults shown):

```yaml
custom:
  splitStacks:
    perFunction: false
    perType: true
    perGroupFunction: false
```

## Migration Strategies

### Per Lambda

This splits resources off in to a nested stack dedicated to the associated Lambda function. This defaults to off in 1.x but will switch to enabled by default in 2.x

### Per Type

This moves resources in to a nested stack for the given resource type. If `Per Lambda` is enabled, it takes precedence over `Per Type`.

### Per Lambda Group

This splits resources off in to a nested stack dedicated to a set of Lambda functions and associated resources. If `Per Lambda` or `Per Type` is enabled, it takes precedence over `Per Lambda Group`. In order to control the number of nested stacks, following configurations are needed:

```yaml
custom:
  splitStacks:
    nestedStackCount: 20 # Controls the number of created nested stacks
    perFunction: false
    perType: false
    perGroupFunction: true
```

Once set, the `nestedStackCount` configuration should never be changed because the only reliable method of changing it later on is to recreate the deployment from scratch.

## Concurrency

In order to avoid `API rate limit` errors, it is possible to configure the plugin in 2 different ways:
 * Set nested stacks to depend on each others.
 * Set resources in the nested stack to depend on each others.

This feature comes with a 2 new configurations, `stackConcurrency` and `resourceConcurrency` :


```yaml
custom:
  splitStacks:
    perFunction: true
    perType: false
    perGroupFunction: false
    stackConcurrency: 5 # Controls if enabled and how much stacks are deployed in parallel. Disabled if absent.
    resourceConcurrency: 10 # Controls how much resources are deployed in parallel. Disabled if absent.
```

## Limitations

This plugin is not a substitute for fine-grained services - try to limit the size of your service. This plugin has a hard limit of 200 sub-stacks and does not try to create any kind of tree of nested stacks.

## Advanced Usage

If you create a file in the root of your Serverless project called `stacks-map.js` this plugin will load it.

This file can customize a few things.

```javascript
module.exports = {
  'AWS::DynamoDB::Table': { destination: 'Dynamodb' }
}
```

```javascript
module.exports = (resource, logicalId) => {
  if (logicalId.startsWith("Foo")) return { destination: 'Foo' };

  // Falls back to default
};
```

__Be careful when introducing any customizations to default config. Many kind of resources (as e.g. DynamoDB tables) cannot be freely moved between CloudFormation stacks (that can only be achieved via full removal and recreation of the stage)__
