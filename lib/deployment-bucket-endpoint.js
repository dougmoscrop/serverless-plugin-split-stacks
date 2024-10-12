'use-strict';

const { endpoint } = require('aws-info');
const { ProxyAgent } = require('proxy-agent');
const https = require('https');

function getOptions(cli, bucket, endpoint, useProxy) {
  const method = 'HEAD';
  const proxyAgent = new ProxyAgent();

  if (bucket.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/) === null) {
    cli.log(`WARNING: DNS incompatible bucket name detected (${bucket}).`);
    cli.log(`    These will cause errors starting 30 Sep 2020 due to S3 API changes`);
    cli.log(`    and SSL certificate mismatches for virtual-hosting style S3 URLs.`);
    cli.log(`    Read more here: https://forums.aws.amazon.com/ann.jspa?annID=6776`);

    return {
      method,
      hostname: endpoint,
      path: `/${bucket}`,
      agent: useProxy ? proxyAgent : undefined
    };
  }

  return {
    method,
    hostname: `${bucket}.${endpoint}`,
    path: '/',
    agent: useProxy ? proxyAgent : undefined
  };
}

module.exports = function setDeploymentBucketEndpoint() {
  const useProxy = !!this.config.proxyAgent

  return new Promise((resolve, reject) => {
    const { service: { provider } } = this.serverless;
    const { deploymentBucket } = provider;
    const { region = provider.region } = this.options;

    const s3Endpoint = endpoint('S3', region);

    if (deploymentBucket) {
      const bucket = typeof deploymentBucket === 'object'
        ? deploymentBucket.name
        : deploymentBucket;

      const options = getOptions(this.serverless.cli, bucket, s3Endpoint, useProxy);
      const request = https.request(options);

      request.on('response', response => {
        const bucketRegion = response.headers['x-amz-bucket-region'] || region;
        const bucketEndpoint = endpoint('S3', bucketRegion);
        resolve(bucketEndpoint);
      });
      request.on('error', reject);
      request.end();
    } else {
      resolve(s3Endpoint);
    }
  })
  .then(bucketEndpoint => {
    this.deploymentBucketEndpoint = bucketEndpoint
  });
}
