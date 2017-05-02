'use strict';

const _ = require('lodash');

const VersionKey = 'AWS::Lambda::Version';
const FunctionKey = 'AWS::Lambda::Function';

module.exports = function() {
  _.each(this.resourcesByType[VersionKey], (version, versionId) => {
    const functionId = this.getLogicalId(version.Properties.FunctionName);
    this.migrate(versionId, functionId);

    this.depends(version, functionId);
  });

  _.each(this.resourcesByType[FunctionKey], (functionResource, functionId) => {
    this.migrate(functionId, functionId);
  });
};
