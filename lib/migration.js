'use strict';

module.exports = class Migration {
  constructor(options) {
    Object.assign(this, options);
  }

  parameterize(name, value) {
    const parameterName = `${name}Parameter`;

    if(value.Ref)
        value.Ref = typeof value.Ref === 'string' ? value.Ref.replace(/Parameter$/, '') : value.Ref;

    if(value['Fn::GetAtt']) {
        const GetAtt = value['Fn::GetAtt'];

        value['Fn::GetAtt'] = typeof GetAtt === 'string'
            ? GetAtt.replace(/Parameter$/, '')
            : [GetAtt[0], GetAtt[1].replace(/Parameter$/, '')];
    }

    this.stack.Parameters[parameterName] = { Type: 'String' };
    this.stackResource.Properties.Parameters[parameterName] = value;

    return { Ref: parameterName };
  }
};
