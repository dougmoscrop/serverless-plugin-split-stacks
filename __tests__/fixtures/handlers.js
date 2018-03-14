'use strict';

module.exports.a = function(event, context,  callback) {
  callback();
};

module.exports.b = function(event, context, callback) {
  callback(null, 'blah');
};

module.exports.c = function(event, context,  callback) {
  callback();
};
