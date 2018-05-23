'use strict';

module.exports = (resource, logicalId) => {
  if (logicalId === 'Foo') {
    return { destination: 'Foo' };
  }
};