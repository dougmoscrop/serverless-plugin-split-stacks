module.exports = {
  // Example One
  'exampleOneLambdaPermissionApiGateway': {
    Type: 'AWS::Lambda::Permission',
    Destination: 'exampleOne'
  },
  'exampleOneLambdaFunction': {
    Type: 'AWS::Lambda::Function',
    Destination: 'exampleOne'
  },
  'exampleOneLogGroup': {
    Type: 'AWS::Logs::LogGroup',
    Destination: 'exampleOne'
  },
  'example/one': {
    Type: 'AWS::ApiGateway::Resource',
    Destination: 'exampleOne'
  },
  'example/oneget': {
    Type: 'AWS::ApiGateway::Method',
    Destination: 'exampleOne'
  },
  'example/oneOPTIONS': {
    Type: 'AWS::ApiGateway::Method',
    Destination: 'exampleOne'
  },

  // Example Two
  'exampleTwoLambdaPermissionApiGateway': {
    Type: 'AWS::Lambda::Permission',
    Destination: 'exampleTwo'
  },
  'exampleTwoLambdaFunction': {
    Type: 'AWS::Lambda::Function',
    Destination: 'exampleTwo'
  },
  'exampleTwoLogGroup': {
    Type: 'AWS::Logs::LogGroup',
    Destination: 'exampleTwo'
  },
  'example/two': {
    Type: 'AWS::ApiGateway::Resource',
    Destination: 'exampleTwo'
  },
  'example/twoget': {
    Type: 'AWS::ApiGateway::Method',
    Destination: 'exampleTwo'
  },
  'example/twoOPTIONS': {
    Type: 'AWS::ApiGateway::Method',
    Destination: 'exampleTwo'
  },

  // Other
  'NotMigrated': {
    Type: 'AWS::ApiGateway::Method'
  },
  'YetAnotherOneNotMigrated': {
    Type: 'AWS::Lambda::Permission'
  }
};
