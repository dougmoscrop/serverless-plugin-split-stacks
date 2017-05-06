'use strict';

const _ = require('lodash');

module.exports = function replaceOutputs() {
  const references = this.getReferencedResources(this.rootTemplate.Outputs);

  _.each(references, reference => {
    if (reference.id in this.resourceMigrations) {
      const newValue = this.nestedOutput(reference, this.resourceMigrations[reference.id]);
      reference.replace(newValue);
    }
  });
};
