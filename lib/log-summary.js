'use strict';

const _ = require('lodash');

module.exports = function logSummary() {
  if (this.nestedStacks) {
    const before = Object.keys(this.resourcesById).length;
    const after = Object.keys(this.rootTemplate.Resources).length;
    const stacks = Object.keys(this.nestedStacks).length;

    this.log(`Summary: ${(stacks + before) - after} resources migrated in to ${stacks} nested stacks`);
    this.log(`   Resources per stack:`);
    this.log(`   - (root): ${after}`);

    _.each(this.nestedStacks, (stack, stackName) => {
      const count = Object.keys(stack.Resources).length;
      this.log(`   - ${stackName}: ${count}`);
    });
  }
};
