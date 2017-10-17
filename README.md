[![CircleCI](https://circleci.com/gh/dougmoscrop/serverless-plugin-split-stacks.svg?style=svg)](https://circleci.com/gh/dougmoscrop/serverless-plugin-split-stacks)

Be advised: This plugin currently migrates the `RestApi` resource to a nested stack, which causes your URL to change.

# serverless-plugin-split-stacks

The goal if this plugin is to split some resources off in to nested stacks to work around the 200 CloudFormation resource limit.

Migrating resources to nested stacks is tricky beacuse some plugins rely on querying the resource from the main stack and would need to understand this. There are also plenty of issues with moving resources in existing deployments (you frequently get 'resource already exists' errors). Because of this, this plugin is very conservative. It moves only resources of types that seem to be easy to move.

__Default migrations map is configured withiin [split-stacks.js](https://github.com/dougmoscrop/serverless-plugin-split-stacks/blob/master/stacks-map.js)__


If you need you may tweak this map in your serverless project by introducing `stacks-map.js` module in root folder of your project (this module if exists will be transparently loaded by the plugin).

Example of customization, that moves DynamoDB resources to nested stack:

```javascript
const stacksMap = require('serverless-plugin-split-stacks/stacks-map');

stacksMap['AWS::DynamoDB::Table'] = { destination: 'Dynamodb' };
```

__Be careful when introducing any customizations to default config. Many kind of resources (as e.g. DynamoDB tables) cannot be freely moved between CloudFormation stacks__

## Limitations

You should try to limit the number of functions you have in your service to 20 or so. This plugin is not a substitute for fine-grained services - but even with a domain of a single entity and sub-entity, CRUD operations on each and some stream listeners its easy to exceed 200 resources once monitoring is in place.
