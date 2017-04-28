'use strict';

module.exports = class Reference {
  constructor(resourceId, details) {
    this.id = resourceId;
    Object.assign(this, details);
  }

  getDependencyName() {
    if ('Fn::GetAtt' in this.value) {
      return this.value['Fn::GetAtt'].join('');
    }
    return this.id;
  }

  replace(newValue) {
    this.parent[this.key] = newValue;
  }
};
