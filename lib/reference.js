'use strict';

module.exports = class Reference {
  constructor(resourceId, details) {
    this.id = resourceId;
    Object.assign(this, details);
  }

  getDependencyName() {
    if (typeof this.value === 'object' && this.value && 'Fn::GetAtt' in this.value) {
      let getAtt = this.value['Fn::GetAtt'];
      if (typeof getAtt === 'string') getAtt = getAtt.split('.');
      return getAtt.join('')
        .replace(/\./g, 'Dot')
        .replace(/[^a-zA-Z0-9]*/gi, '');
    }
    return this.id;
  }

  replace(newValue) {
    this.parent[this.key] = newValue;
  }
};
