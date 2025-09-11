'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

function writeNestedStacks() {
  const baseDir = path.join(this.serverless.config.servicePath, '.serverless');

  _.forOwn(this.migratedStacks, (resources, stackName) => {
    const fileName = `cloudformation-template-${stackName}.json`;
    const filePath = path.join(baseDir, fileName);

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: resources,
          Outputs: this.outputs[stackName] || {},
        },
        null,
        2
      )
    );

    // ✅ Register file as artifact so Serverless uploads it
    if (!this.serverless.service.package.artifacts) {
      this.serverless.service.package.artifacts = [];
    }
    if (!this.serverless.service.package.artifacts.includes(filePath)) {
      this.serverless.service.package.artifacts.push(filePath);
    }
    // ✅ v4: also tell AWS deploy plugin explicitly
    if (!this.serverless.service.provider.coreCloudFormationTemplate) {
      this.serverless.service.provider.coreCloudFormationTemplate = {};
    }
    if (!this.serverless.service.provider.deploymentArtifacts) {
      this.serverless.service.provider.deploymentArtifacts = [];
    }
    this.serverless.service.provider.deploymentArtifacts.push(filePath);
  });
}

module.exports = writeNestedStacks;
