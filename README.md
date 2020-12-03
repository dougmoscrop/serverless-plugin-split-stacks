[![CircleCI](https://circleci.com/gh/dougmoscrop/serverless-plugin-split-stacks.svg?style=svg)](https://circleci.com/gh/dougmoscrop/serverless-plugin-split-stacks)

# serverless-plugin-split-stacks

This plugin migrates CloudFormation resources in to nested stacks in order to work around the 500 resource limit.


**Install**

Run `npm install` in your Serverless project.

    $ npm install serverless-plugin-split-stacks --save-dev

Add the plugin to your serverless.yml file

    plugins:
      - serverless-plugin-split-stacks

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

In order to avoid `API rate limit` errors, it is possible to configure the plugin in 3 different ways:
 * Set nested stacks to depend on each others.
 * Set resources in the nested stack to depend on each others.
 * Manually configure which nested stack depends on which.

This feature comes with a 3 configurations, `stackConcurrency`, `resourceConcurrency` and `dependsOn` :

```yaml
custom:
  splitStacks:
    perFunction: true
    perType: false
    perGroupFunction: false
    stackConcurrency: 5 # Controls if enabled and how much stacks are deployed in parallel. Disabled if absent.
    resourceConcurrency: 10 # Controls how much resources are deployed in parallel. Disabled if absent.
    dependsOn: # Object mapping between the nested stacks
      stack1: stack2
```

**Note:** The stackConcurrency and dependsOn options must be used exclusively. An error will be thrown if both of these values are set.

## Limitations

This plugin is not a substitute for fine-grained services - try to limit the size of your service. This plugin splits on configurable limits on resources, outputs and parameters, with the following values as defaults.

```yaml
custom:
  splitsStacks:
    outputLimit: 200
    parameterLimit: 200
    resourceLimit: 500
```

## Advanced Usage

If you create a file in the root of your Serverless project called `stacks-map.js` this plugin will load it.

This file can customize migrations, either by exporting a simple map of resource type to migration, or a function that can have whatever logic you want.

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

You can also point to your custom splitter from the `custom` block in your serverless file:
```
custom:
  splitStacks:
    custom: path/to/your/splitter.js
```

__Be careful when introducing any customizations to default config. Many kind of resources (as e.g. DynamoDB tables) cannot be freely moved between CloudFormation stacks (that can only be achieved via full removal and recreation of the stage)__

### Force Migration

Custom migrations can specify `{ force: true }` to force the migration of an existing resource in to a new stack. BE CAREFUL. This will cause a resource to be deleted and recreated. It may not even work if CloudFormation tries to create the new one before deleting the old one and they have a name or some other unique property that cannot have two resources existing at the same time. It can also mean a small window of downtime during this period, for example as an `AWS::Lambda::Permission` is deleted/recreated calls may be denied until IAM sorts things out.
