// Generated by CoffeeScript 1.12.4
(function() {
  var defaultValue, inherit, renderExample;

  inherit = require('./inherit');

  defaultValue = function(type) {
    switch (type) {
      case 'boolean':
        return true;
      case 'number':
        return 1;
      case 'string':
        return 'Hello, world!';
    }
  };

  module.exports = renderExample = function(root, dataStructures) {
    var i, item, j, key, len, member, obj, properties, ref, ref1, ref2, ref3, results;
    switch (root.element) {
      case 'boolean':
      case 'string':
      case 'number':
        if (root.content != null) {
          return root.content;
        } else {
          return defaultValue(root.element);
        }
        break;
      case 'enum':
        if (((ref1 = root.attributes) != null ? (ref2 = ref1.samples) != null ? ref2[0][0].content : void 0 : void 0) != null) {
          return root.attributes.samples[0][0].content;
        } else {
          return renderExample(root.content[0], dataStructures);
        }
        break;
      case 'array':
        ref3 = root.content || [];
        results = [];
        for (j = 0, len = ref3.length; j < len; j++) {
          item = ref3[j];
          results.push(renderExample(item, dataStructures));
        }
        return results;
        break;
      case 'object':
        obj = {};
        properties = root.content.slice(0);
        i = 0;
        while (i < properties.length) {
          member = properties[i];
          i++;
          if (member.element === 'ref') {
            ref = dataStructures[member.content.href];
            i--;
            properties.splice.apply(properties, [i, 1].concat(ref.content));
            continue;
          } else if (member.element === 'select') {
            member = member.content[0].content[0];
          }
          key = member.content.key.content;
          obj[key] = renderExample(member.content.value, dataStructures);
        }
        return obj;
      default:
        ref = dataStructures[root.element];
        if (ref) {
          return renderExample(inherit(ref, root), dataStructures);
        }
    }
  };

}).call(this);
