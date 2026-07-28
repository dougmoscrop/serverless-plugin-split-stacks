'use-strict';

module.exports = async function setDeploymentBucketName() {
  try {
    const {service: {provider}, version} = this.serverless;
    const {deploymentBucket} = provider;

    if (deploymentBucket) {
      this.deploymentBucketName = deploymentBucket;
      return;
    }

    const isVersion4OrAbove = parseInt(version.split('.')[0], 10) >= 4;
    if (isVersion4OrAbove) {
      this.deploymentBucketName = await this.serverless.getProvider('aws').getServerlessDeploymentBucketName();
    } else {
      this.deploymentBucketName = { Ref: 'ServerlessDeploymentBucket' };
    }
  } catch (error) {
    throw new Error(`Failed to set deployment bucket name: ${error.message}`);
  }
};
