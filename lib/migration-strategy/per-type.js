'use strict';

const path = require('path');

const DEFAULT_STACKS_MAP = {
  'AWS::CloudWatch::Alarm': {
    destination: 'Alarms',
    allowSuffix: true
  },
  'AWS::Logs::MetricFilter': {
    destination: 'Filters',
    allowSuffix: true
  },
  'AWS::Logs::SubscriptionFilter': {
    destination: 'Filters',
    allowSuffix: true
  },
  'AWS::ApiGateway::Resource': {
    destination: 'API'
  },
  'AWS::ApiGateway::RestApi': {
    destination: 'API'
  },
  'AWS::Lambda::Version': {
    destination: 'Versions'
  },
  'AWS::Lambda::Permission': {
    destination: 'Permissions'
  },
  'AWS::SNS::Subscription': {
    destination: 'Subscriptions'
  },
  'AWS::SNS::TopicPolicy': {
    destination: 'Policies'
  },
  'AWS::S3::BucketPolicy': {
    destination: 'Policies'
  },
  'AWS::SQS::QueuePolicy': {
    destination: 'Policies'
  }
};

module.exports = class PerType {

  constructor(plugin) {
    this.stacksMap = plugin.stacksMap;

    if (plugin.config.perType || plugin.config.perType === undefined) {
      Object.assign(this.stacksMap, DEFAULT_STACKS_MAP);
    }
    
    // Load stacks map customizations
    const customizationsPath = path.resolve(
      plugin.serverless.config.servicePath,
      'stacks-map.js'
    );
  
    try {
      // support exporting a custom stack map
      const customStacksMap = require(customizationsPath);
      Object.assign(this.stacksMap, customStacksMap);
    } catch (e) {
      // If module not found ignore, otherwise crash
      if (e.code !== 'MODULE_NOT_FOUND' || !e.message.endsWith(`'${customizationsPath}'`)) {
        throw e;
      }
    }
  }

  migration(resource) {
    return this.stacksMap[resource.Type];
  }
  
}
