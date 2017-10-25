'use strict';

module.exports = class Reference {
  constructor(resourceId, details) {
    this.id = resourceId;
    Object.assign(this, details);
  }

  getDependencyName() {
    if ('Fn::GetAtt' in this.value) {
      let getAtt = this.value['Fn::GetAtt'];
      if (typeof getAtt === 'string') getAtt = getAtt.split('.');
      return getAtt.join('');
    }
    return this.id;
  }

  replace(newValue) {
    this.parent[this.key] = newValue;
  }
};
