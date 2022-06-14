"use strict";

function printStackInfo(stackName, isLast = false) {
  const {
    Outputs = {},
    Resources = {},
    Parameters = {},
  } = stackName ? this.nestedStacks[stackName] : this.rootTemplate;
  const outputs = Object.keys(Outputs).length;
  const parameters = Object.keys(Parameters).length;
  const resources = Object.keys(Resources).length;
  const references = Object.values(Resources).reduce(
    (acc, res) => this.getReferencedResources(res).length + acc,
    0
  );

  this.log(`${isLast ? "└" : "├"}─ ${stackName || "(root)"}: ${resources}`);
  this.log(`${isLast ? " " : "│"}  ├─ Outputs: ${outputs}`);
  this.log(
    `${
      isLast ? " " : "│"
    }  └─ Parameters: ${parameters} (References: ${references})`
  );
}

module.exports = function logSummary() {
  if (this.nestedStacks) {
    const before = Object.keys(this.resourcesById).length;
    const after = Object.keys(this.rootTemplate.Resources).length;
    const stacks = Object.values(this.nestedStacks).filter(
      (stack) => Object.keys(stack.Resources).length > 0
    ).length;

    this.log(
      `Summary: ${
        stacks + before - after
      } resources migrated into ${stacks} nested stacks`
    );
    printStackInfo.call(this, null);

    Object.keys(this.nestedStacks)
      .sort()
      .forEach((name, i, arr) => {
        printStackInfo.call(this, name, i >= arr.length - 1);
      });
  }
};
