'use strict';

module.exports = (resource, logicalId) => {
  if (logicalId === 'Foo') {
    return { destination: 'Foo' };
  }

  if (logicalId === 'Skip') {
    return false;
  }
};
