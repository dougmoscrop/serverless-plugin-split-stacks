'use strict';

const crypto = require('crypto');

const PerFunction = require('./per-function');

class PerGroupFunction extends PerFunction {

  constructor(plugin) {
    super(plugin);

    if (this.isStrategyActive()) {
      if (
        !plugin.config.nestedStackCount
        || typeof plugin.config.nestedStackCount !== 'number'
        || !Number.isInteger(plugin.config.nestedStackCount)
        || plugin.config.nestedStackCount < 2
      ) {
        throw Error('nestedStackCount configuration must be an integer greater than 2');
      }

      this.nestedStackCount = plugin.config.nestedStackCount;
    }
  }

  // overloaded
  getNestedStackName(normalizedLambdaName) {
    const hash = crypto.createHash('sha1').update(normalizedLambdaName).digest('hex');

    return String(Number.parseInt(hash.substring(0,10), 16) % this.nestedStackCount + 1);
  }

  // overloaded
  isStrategyActive() {
    return this.plugin.config.perGroupFunction;
  }
}

module.exports = PerGroupFunction;
