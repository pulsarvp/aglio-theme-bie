(function() {
  var deepEqual, inherit, renderSchema;

  deepEqual = require('assert').deepEqual;

  inherit = require('./inherit');

  module.exports = renderSchema = function(root, dataStructures) {
    var error, exclusive, i, item, items, j, k, key, len, len1, len2, len3, m, member, n, name, option, optionSchema, prop, properties, ref, ref1, ref10, ref11, ref12, ref13, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, required, schema, typeAttr;
    schema = {};
    switch (root.element) {
      case 'boolean':
      case 'string':
      case 'number':
        schema.type = root.element;
        if (root.content != null) {
          schema.example = root.content;
        }
        break;
      case 'enum':
        schema.type = 'enum';
        schema["enum"] = [];
        ref1 = root.content || [];
        for (j = 0, len = ref1.length; j < len; j++) {
          item = ref1[j];
          schema["enum"].push(item.content);
        }
        if (((ref2 = root.attributes) != null ? (ref3 = ref2.samples) != null ? ref3[0][0].content : void 0 : void 0) != null) {
          schema.example = root.attributes.samples[0][0].content;
        }
        break;
      case 'array':
        schema.type = 'array';
        items = [];
        ref4 = root.content || [];
        for (k = 0, len1 = ref4.length; k < len1; k++) {
          item = ref4[k];
          items.push(renderSchema(item, dataStructures));
        }
        if (items.length === 1) {
          schema.items = items[0];
        } else if (items.length > 1) {
          try {
            schema.items = items.reduce(function(l, r) {
              return deepEqual(l, r) || r;
            });
          } catch (error) {
            schema.items = {
              'anyOf': items
            };
          }
        }
        if ((((ref5 = schema.items) != null ? ref5.name : void 0) != null)) {
          schema.type = 'array[' + schema.items.name + ']';
        }
        break;
      case 'object':
      case 'option':
        schema.type = 'object';
        schema.properties = {};
        required = [];
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
            exclusive = [];
            ref6 = member.content;
            for (m = 0, len2 = ref6.length; m < len2; m++) {
              option = ref6[m];
              optionSchema = renderSchema(option, dataStructures);
              ref7 = optionSchema.properties;
              for (key in ref7) {
                prop = ref7[key];
                exclusive.push(key);
                schema.properties[key] = prop;
              }
            }
            if (!schema.allOf) {
              schema.allOf = [];
            }
            schema.allOf.push({
              not: {
                required: exclusive
              }
            });
            continue;
          }
          key = member.content.key.content;
          schema.properties[key] = renderSchema(member.content.value, dataStructures);
          schema.properties[key].name = key;
          schema.properties[key].required = false;
          if (((ref8 = member.meta) != null ? ref8.description : void 0) != null) {
            schema.properties[key].description = member.meta.description;
          }
          if ((ref9 = member.attributes) != null ? ref9.typeAttributes : void 0) {
            typeAttr = member.attributes.typeAttributes;
            if (typeAttr.indexOf('required') !== -1) {
              if (required.indexOf(key) === -1) {
                required.push(key);
              }
            }
            if (typeAttr.indexOf('nullable') !== -1) {
              schema.properties[key].type = [schema.properties[key].type, 'null'];
            }
          }
        }
        for (n = 0, len3 = required.length; n < len3; n++) {
          name = required[n];
          schema.properties[name].required = true;
        }
        break;
      default:
        ref = dataStructures[root.element];
        if (ref) {
          schema = renderSchema(inherit(ref, root), dataStructures);
        }
    }
    if (((ref10 = root.attributes) != null ? ref10["default"] : void 0) != null) {
      schema["default"] = root.attributes["default"];
    }
    if (((ref11 = root.meta) != null ? ref11.id : void 0) != null) {
      schema.name = root.meta.id;
    }
    if (((ref12 = root.meta) != null ? ref12.description : void 0) != null) {
      schema.description = root.meta.description;
    }
    if ((ref13 = root.attributes) != null ? ref13.typeAttributes : void 0) {
      typeAttr = root.attributes.typeAttributes;
      if (typeAttr.indexOf('nullable') !== -1) {
        schema.type = [schema.type, 'null'];
      }
    }
    return schema;
  };

}).call(this);
