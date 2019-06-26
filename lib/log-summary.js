'use strict';

module.exports = function logSummary() {
  if (this.nestedStacks) {
    const before = Object.keys(this.resourcesById).length;
    const after = Object.keys(this.rootTemplate.Resources).length;
    const stacks = Object.values(this.nestedStacks).filter(stack => Object.keys(stack.Resources).length > 0).length;

    this.log(`Summary: ${(stacks + before) - after} resources migrated in to ${stacks} nested stacks`);
    this.log(`   Resources per stack:`);
    this.log(`   - (root): ${after}`);

    Object.keys(this.nestedStacks).sort().forEach(stackName => {
      const stack = this.nestedStacks[stackName];
      const count = Object.keys(stack.Resources).length;

      if (count > 0) {
        this.log(`   - ${stackName}: ${count}`);
      }
    });
  }
};
