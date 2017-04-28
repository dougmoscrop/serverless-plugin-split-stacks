# 🚨 Not ready yet 🚨

This is a work in progress and will probably depend on some changes in Serverless before it works correctly. Right now it does not properly support the 'seprate deploy from package' concept.

# serverless-plugin-split-stacks

This goal of this plugin is to work around the 200 resource CloudFormation limit when deploying serverless applications of a reasonable size. It does not intend to support arbitrarily large services, but rather deal with common enough use-cases that hit this limit, such as having a number of CloudWatch Metrics and Alarms per function.

Each function is split in to its own stack, and some other resource types are split in to their own dedicated stacks.

There are some quirks with how CloudFormation processes references, even with `DependsOn` set, so resources such as S3 buckets have not been successful targets for migration.

The `lib/migrations` folder contains a set of helpers that attempt to detect resources, since not all resources can be easily grouped to a single function just by checking references. Only resources that definitely have a 1:1 relationship wtih a function are moved in to the function-specific stack.

There are unit tests and an integration test but any help is appreciated to expand testing for the many different ways in which people use Serverless!
