'use strict';

const path = require('path');

const _ = require('lodash');

module.exports = function writeNestedStacks() {
  if (this.nestedStacks) {
    _.each(this.nestedStacks, (stack, stackName) => {
      const fileName = this.getFileName(stackName);
      const destination = path.join(
       this.serverless.config.servicePath,
       '.serverless',
       fileName
     );

     if(this.serverless.options['minify-template']) {
      stack = JSON.stringify(stack, null, 0);
     }

     console.log('call', destination, stack)

     this.serverless.utils.writeFileSync(destination, stack);
   });
 }
};
