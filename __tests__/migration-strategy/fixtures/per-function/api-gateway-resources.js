module.exports = [
  {
    functionName: "exampleOne",
    http: {
      path: "example/one",
      method: "get",
      cors: {
        origins: ["*"],
        origin: "*",
        methods: ["OPTIONS", "GET"],
        headers: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
          "X-Amz-User-Agent"
        ],
        allowCredentials: false
      },
      integration: "AWS_PROXY"
    }
  },
  {
    functionName: "exampleTwo",
    http: {
      path: "example/two",
      method: "get",
      cors: {
        origins: ["*"],
        origin: "*",
        methods: ["OPTIONS", "GET"],
        headers: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
          "X-Amz-User-Agent"
        ],
        allowCredentials: false
      },
      integration: "AWS_PROXY"
    }
  }
];
