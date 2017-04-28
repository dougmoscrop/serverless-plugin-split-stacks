'use strict';

const _ = require('lodash');

const RoleKey = 'AWS::IAM::Role';

module.exports = function() {
  _.each(this.resourcesByType[RoleKey], (role, roleId) => {
    this.migrate(roleId, 'Core')
  });
};
