'use strict';

const _ = require('lodash');

const LogGroupKey = 'AWS::Logs::LogGroup';
const MetricFilterKey = 'AWS::Logs::MetricFilter';
const AlarmKey = 'AWS::CloudWatch::Alarm';

function findFunctionIdForLogGroup(logGroupId, functions) {
  let result;

  _.each(functions, (functionResource, functionId) => {
    if (_.includes(functionResource.DependsOn, logGroupId)) {
      if (result) {
        throw new Error(`LogGroup ${logGroupId} depended on by more than one function: ${result} and ${functionId}`);
      }
      result = functionId;
    }
  });

  return result;
}

function findLogGroupIdByName(LogGroupName, resourcesByType) {
  return _.findKey(resourcesByType[LogGroupKey], { Properties: { LogGroupName } });
}

function findFunctionIdForAlarm(alarm, functions, resourcesByType) {
  if (alarm.Properties.Namespace === 'AWS/Lambda') {
    const dimensions = alarm.Properties.Dimensions;
    if (Array.isArray(dimensions) && dimensions.length === 1) {
      const value = dimensions[0].Value;

      if (value.Ref in functions) {
        return dimensions[0].Value.Ref;
      }
    }
  } else {
    const metricFilter = findMetricFilterForAlarm(alarm, resourcesByType);

    if (metricFilter) {
      const logGroupName = metricFilter.Properties.LogGroupName;
      const logGroupId = findLogGroupIdByName(logGroupName, resourcesByType);

      if (logGroupId) {
        return findFunctionIdForLogGroup(logGroupId, functions);
      }
    }
  }
}

function findMetricFilterForAlarm(alarm, resourcesByType) {
  const namespace = alarm.Properties.Namespace;
  const metricName = alarm.Properties.MetricName;

  return _.find(resourcesByType[MetricFilterKey], (metricFilter) => {
    const transformations = metricFilter.Properties.MetricTransformations;

    if (Array.isArray(transformations) && transformations.length === 1) {
      const transformation = transformations[0];

      return transformation.MetricNamespace === namespace
        && transformation.MetricName === metricName;
    }
  });
}

module.exports = function() {
  const functions = this.resourcesByType['AWS::Lambda::Function'];

  _.each(this.resourcesByType[LogGroupKey], (logGroup, logGroupId) => {
    const functionId = findFunctionIdForLogGroup(logGroupId, functions);

    if (functionId) {
      this.migrate(logGroupId, functionId);
    }
  });

  _.each(this.resourcesByType[MetricFilterKey], (metricFilter, metricFilterId) => {
    const logGroupName = metricFilter.Properties.LogGroupName;
    const logGroupId = findLogGroupIdByName(logGroupName, this.resourcesByType);

    if (logGroupId) {
      const functionId = findFunctionIdForLogGroup(logGroupId, functions);

      if (functionId) {
        this.migrate(metricFilterId, functionId);
      }
    }
  });

  _.each(this.resourcesByType[AlarmKey], (alarm, alarmId) => {
    const functionId = findFunctionIdForAlarm(alarm, functions, this.resourcesByType);

    if (functionId) {
      this.migrate(alarmId, functionId);
    } else {
      this.migrate(alarmId, 'Alarms');
    }
  });
};
