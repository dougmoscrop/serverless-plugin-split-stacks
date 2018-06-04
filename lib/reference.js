'use strict';

module.exports = class Reference {
  constructor(resourceId, details) {
    this.id = resourceId;
    Object.assign(this, details);
  }

  getDependencyName() {
    if (typeof this.value === 'object' && this.value && 'Fn::GetAtt' in this.value) {
      const getAtt = this.value['Fn::GetAtt'];

      return this.normalize(
        Array.isArray(getAtt)
          ? getAtt.join('')
          : getAtt
      );
    }

    return this.id;
  }

  replace(newValue) {
    this.parent[this.key] = newValue;
  }

  normalize(value) {
    return value.replace(/[^a-zA-Z0-9]*/gi, '');
  }

};
