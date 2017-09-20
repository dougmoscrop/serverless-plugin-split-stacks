'use-strict';

const _ = require('lodash');

const migrations = {
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

module.exports = function migrateResources() {
  _.each(this.resourcesById, (resource, logicalId) => {
    if (resource.Type in migrations) {
      const migration = migrations[resource.Type];
      const stackName = this.getStackName(migration.destination, migration.allowSuffix);

      if (logicalId in this.resourceMigrations) {
        return;
      }

      this.migrate(logicalId, stackName);
    }
  });
};
