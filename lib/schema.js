(function() {
  var deepEqual, inherit, renderSchema;

  deepEqual = require('assert').deepEqual;

  inherit = require('./inherit');

  module.exports = renderSchema = function(root, dataStructures) {
    var error, exclusive, i, item, items, j, k, key, len, len1, len2, len3, m, member, n, name, option, optionSchema, prop, properties, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, required, schema, typeAttr;
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
        if (((ref4 = root.content) != null ? ref4[0].element : void 0) != null) {
          schema.itemType = root.content[0].element;
        }
        items = [];
        ref5 = root.content || [];
        for (k = 0, len1 = ref5.length; k < len1; k++) {
          item = ref5[k];
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
              'properties': items
            };
          }
        }
        break;
      case 'object':
      case 'option':
        schema.type = 'object';
        if (((ref6 = root.meta) != null ? ref6.id : void 0) != null) {
          schema.itemType = root.meta.id;
        }
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
            ref7 = member.content;
            for (m = 0, len2 = ref7.length; m < len2; m++) {
              option = ref7[m];
              optionSchema = renderSchema(option, dataStructures);
              ref8 = optionSchema.properties;
              for (key in ref8) {
                prop = ref8[key];
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
          if (((ref9 = member.meta) != null ? ref9.description : void 0) != null) {
            schema.properties[key].description = member.meta.description;
          }
          if ((ref10 = member.attributes) != null ? ref10.typeAttributes : void 0) {
            typeAttr = member.attributes.typeAttributes;
            if (typeAttr.indexOf('required') !== -1) {
              if (required.indexOf(key) === -1) {
                required.push(key);
              }
            }
            if (typeAttr.indexOf('nullable') !== -1) {
              schema.properties[key].nullable = true;
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
    if (((ref11 = root.attributes) != null ? ref11["default"] : void 0) != null) {
      schema["default"] = root.attributes["default"];
    }
    if (((ref12 = root.meta) != null ? ref12.id : void 0) != null) {
      schema.name = root.meta.id;
    }
    if (((ref13 = root.meta) != null ? ref13.description : void 0) != null) {
      schema.description = root.meta.description;
    }
    if ((ref14 = root.attributes) != null ? ref14.typeAttributes : void 0) {
      typeAttr = root.attributes.typeAttributes;
      if (typeAttr.indexOf('nullable') !== -1) {
        schema.type = [schema.type, 'null'];
      }
    }
    return schema;
  };

}).call(this);
