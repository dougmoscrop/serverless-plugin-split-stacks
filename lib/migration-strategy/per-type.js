'use strict';

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
    this.stacksMap = {};

    if (plugin.config.perType || plugin.config.perType === undefined) {
      Object.assign(this.stacksMap, DEFAULT_STACKS_MAP);
    }
  }

  migration(resource) {
    return this.stacksMap[resource.Type];
  }
  
}
