module.exports = {
  // Example One
  'exampleOneLambdaPermissionApiGateway': {
    Type: 'AWS::Lambda::Permission',
    Migrated: true
  },
  'exampleOneLambdaFunction': {
    Type: 'AWS::Lambda::Function',
    DependsOn: ['exampleOneLogGroup'],
    Migrated: true
  },
  'exampleOneLogGroup': {
    Type: 'AWS::Logs::LogGroup',
    Migrated: true
  },
  'example/one': {
    Type: 'AWS::ApiGateway::Resource',
    Migrated: true
  },
  'example/oneget': {
    Type: 'AWS::ApiGateway::Method',
    Migrated: true
  },
  'example/oneOPTIONS': {
    Type: 'AWS::ApiGateway::Method',
    Migrated: true
  },

  // Example Two
  'exampleTwoLambdaPermissionApiGateway': {
    Type: 'AWS::Lambda::Permission',
    Migrated: true
  },
  'exampleTwoLambdaFunction': {
    Type: 'AWS::Lambda::Function',
    DependsOn: ['exampleTwoLogGroup'],
    Migrated: true
  },
  'exampleTwoLogGroup': {
    Type: 'AWS::Logs::LogGroup',
    Migrated: true
  },
  'example/two': {
    Type: 'AWS::ApiGateway::Resource',
    Migrated: true
  },
  'example/twoget': {
    Type: 'AWS::ApiGateway::Method',
    Migrated: true
  },
  'example/twoOPTIONS': {
    Type: 'AWS::ApiGateway::Method',
    Migrated: true
  },

  // Example Two
  'exampleThreeLambdaPermissionApiGateway': {
    Type: 'AWS::Lambda::Permission',
    Migrated: true
  },
  'exampleThreeLambdaFunction': {
    Type: 'AWS::Lambda::Function',
    DependsOn: ['exampleThreeLogGroup'],
    Migrated: true
  },
  'exampleThreeLogGroup': {
    Type: 'AWS::Logs::LogGroup',
    Migrated: true
  },
  'example/three': {
    Type: 'AWS::ApiGateway::Resource',
    Migrated: true
  },
  'example/threeget': {
    Type: 'AWS::ApiGateway::Method',
    Migrated: true
  },
  'example/threeOPTIONS': {
    Type: 'AWS::ApiGateway::Method',
    Migrated: true
  },

  // Other
  'NotMigrated': {
    Type: 'AWS::ApiGateway::Method',
    Migrated: false
  },
  'YetAnotherOneNotMigrated': {
    Type: 'AWS::Lambda::Permission',
    Migrated: false
  }
};
