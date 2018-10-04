'use strict';

const _ = require('lodash');

function replace(migration, condition) {
  const conditionParamName = `${condition}IsMet`;
  const parameter = migration.parameterize(conditionParamName, {
    'Fn::If': [condition, 'true', 'false']
  });

  return {
    'Fn::Equals': [parameter, 'true']
  };
}

module.exports = function replaceConditions() {
  _.each(this.resourceMigrations, migration => {
    const resource = migration.resource;

    if (resource.Condition) {
      const condition = resource.Condition;
      const stack = migration.stack;

      stack.Conditions = stack.Conditions || {};
      stack.Conditions[condition] = stack.Conditions[condition] || replace(migration, condition);
    }
  });
};
