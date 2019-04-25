'use-strict';

const { endpoint } = require('aws-info');
const https = require('https');

const dnsCompatible = (name) => name.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/) !== null;

const emitDnsDeprecationWarning = (cli, bucket) => {
  cli.log(`WARNING: DNS incompatible bucket name detected (${bucket}).`);
  cli.log(`    These will cause errors starting 30 Sep 2020 due to S3 API changes`);
  cli.log(`    and SSL certificate mismatches for virtual-hosting style S3 URLs.`);
  cli.log(`    Read more here: https://forums.aws.amazon.com/ann.jspa?annID=6776`);
}

module.exports = function setDeploymentBucketEndpoint() {
  const bucket = this.serverless.service.provider.deploymentBucket;
  const ourRegion = this.options.region || this.serverless.service.provider.region
  const s3Endpoint = endpoint('S3', ourRegion);
  if (bucket === undefined) {
    this.deploymentBucketEndpoint = s3Endpoint;
  } else {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'HEAD',
      };
      if (dnsCompatible(bucket)) {
        options.hostname = `${bucket}.${s3Endpoint}`;
        options.path = '/';
      } else {
        emitDnsDeprecationWarning(this.serverless.cli, bucket);
        options.hostname = s3Endpoint;
        options.path = `/${bucket}`;
      }
      const request = https.request(options);
      request.on('response', response => {
        const bucketRegion = response.headers['x-amz-bucket-region'];
        this.deploymentBucketEndpoint = endpoint('S3', bucketRegion);
        resolve();
      });
      request.on('error', reject);
      request.end();
    });
  }
}
