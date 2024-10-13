import { usePowerShell, cd } from 'zx'
import aws from 'aws-sdk'

/* eslint-disable no-console */

if (process.platform === 'win32') {
  usePowerShell()
}

cd(path.join(__dirname, 'fixtures'))

await $`npx serverless deploy`
await $`npx serverless invoke -f a`
await $`npx serverless invoke -f b`

const cf = new aws.CloudFormation({
  region: 'us-east-1',
});

await cf.describeStackResources({
  StackName: 'split-stack-test-dev'
})
.promise()
.then(res => {
  return res.StackResources.find(res => {
    return res.LogicalResourceId === 'PermissionsNestedStack';
  });
})
.then(stack => {
  if (stack) {
    const arnParts = stack.PhysicalResourceId.split(':');
    const nameParts = arnParts[5].split('/');

    return cf.describeStackResources({
      StackName: nameParts[1]
    })
    .promise();
  }
  throw new Error('Could not find Permissions nested stack');
})
.then(res => {
  const some = res.StackResources.find(res => res.LogicalResourceId === 'SomePermission');
  const other = res.StackResources.find(res => res.LogicalResourceId === 'SomeOtherPermission');

  if (some) {
    if (other) {
      throw new Error('SomeOtherPermission should not exist due to FalseCondition');
    }
    return;
  }
  throw new Error('SomePermission should exist from TrueCondition')
})
.then(() => {
  console.log('test passed')
}, (e) => {
  console.log('test failed', e)
})

await $`npx serverless remove`
