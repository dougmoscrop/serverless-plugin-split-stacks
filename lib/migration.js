'use strict';

module.exports = class Migration {
  constructor(options) {
    Object.assign(this, options);
  }

  parameterize(name, value) {
    const parameterName = `${name}Parameter`;

    this.stack.Parameters[parameterName] = { Type: 'String' };
    this.stackResource.Properties.Parameters[parameterName] = value;

    return { Ref: parameterName };
  }
};
