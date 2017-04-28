'use strict';

const _ = require('lodash');

const EventSourceMappingKey = 'AWS::Lambda::EventSourceMapping';

module.exports = function() {
  _.each(this.resourcesByType[EventSourceMappingKey], (mapping, mappingId) => {
    const functionName = mapping.Properties.FunctionName;

    if (functionName) {
      const functionId = this.getLogicalId(functionName);
      this.migrate(mappingId, functionId);
    }
  });
};
