'use strict';

const _ = require('lodash');

module.exports = function() {
  _.each(this.resourcesByType, (resources, resourceType) => {
    if (resourceType.indexOf('AWS::ApiGateway::') === 0) {
      _.each(resources, (resource, resourceId) => {
        this.migrate(resourceId, 'API');
      });
    }
  });
};
