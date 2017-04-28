'use-strict';

const apiGateway = require('./api-gateway');
const events = require('./events');
const functions = require('./functions');
const iam = require('./iam');
const logging = require('./logging');

module.exports = [
  apiGateway,
  events,
  functions,
  iam,
  logging
];
