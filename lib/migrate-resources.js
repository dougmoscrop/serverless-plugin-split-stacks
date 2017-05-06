'use-strict';

const _ = require('lodash');

const migrations = {
  'AWS::CloudWatch::Alarm': 'Alarms',
  'AWS::Logs::MetricFilter': 'Filters',
  'AWS::Logs::SubscriptionFilter': 'Filters',
  'AWS::ApiGateway::Resource': 'API',
  'AWS::ApiGateway::RestApi': 'API',
  'AWS::Lambda::Version': 'Versions',
  'AWS::Lambda::Permission': 'Permissions',
  'AWS::SNS::Subscription': 'Subscriptions',
  'AWS::SNS::TopicPolicy': 'Policies',
  'AWS::S3::BucketPolicy': 'Policies',
  'AWS::SQS::QueuePolicy': 'Policies'
};

module.exports = function migrateResources() {
  _.each(this.resourcesById, (resource, logicalId) => {
    if (resource.Type in migrations) {
      const destination = migrations[resource.Type];
      this.migrate(logicalId, destination);
    }
  });
};
