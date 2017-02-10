# This is an extremely simple JSON Schema generator given refracted MSON input.
# It handles the following:
#
# * Simple types, enums, arrays, objects
# * Property descriptions
# * Required, default, nullable properties
# * References
# * Mixins (Includes)
# * Arrays with members of different types
# * One Of (mutually exclusive) properties
#
# It is missing support for many advanced features.
{ deepEqual } = require 'assert'
inherit = require './inherit'

module.exports = renderSchema = (root, dataStructures) ->
  schema = {}

  switch root.element
    when 'boolean', 'string', 'number'
      schema.type = root.element
      if root.content?
        schema.example = root.content
    when 'enum'
      schema.type = 'enum'
      schema.enum = []
      for item in root.content or []
        schema.enum.push item.content
      if root.attributes?.samples?[0][0].content?
        schema.example = root.attributes.samples[0][0].content
    when 'array'
      schema.type = 'array'
      if root.content?[0].element?
        schema.itemType = root.content[0].element

      # Get sub elements
      items = []
      for item in root.content or []
        items.push renderSchema(item, dataStructures)
      if items.length is 1
        schema.items = items[0]
        if (items[0].name?)
          schema.items.itemType = items[0].name
      else if items.length > 1
        try
          schema.items = items.reduce (l, r) -> deepEqual(l, r) or r
        catch
          schema.items =
            'properties': items
        schema.items.itemType = root.element

    when 'object', 'option'
      schema.type = 'object'
      if root.meta?.id?
        schema.itemType = root.meta.id
      schema.properties = {}
      required = []
      properties = root.content.slice(0)
      i = 0
      while i < properties.length
        member = properties[i]
        i++
        if member.element == 'ref'
          ref = dataStructures[member.content.href]
          i--
          properties.splice.apply properties, [i, 1].concat(ref.content)
          continue
        else if member.element == 'select'
          exclusive = []
          for option in member.content
            optionSchema = renderSchema(option, dataStructures)
            for key, prop of optionSchema.properties
              exclusive.push key
              schema.properties[key] = prop
          if not schema.allOf then schema.allOf = []
          schema.allOf.push not:
            required: exclusive
          continue
        key = member.content.key.content
        schema.properties[key] = renderSchema(member.content.value, dataStructures)
        schema.properties[key].name = key
        schema.properties[key].required = false
        if member.meta?.description?
          schema.properties[key].description = member.meta.description
        if member.attributes?.typeAttributes
          typeAttr = member.attributes.typeAttributes
          if typeAttr.indexOf('required') isnt -1
            if required.indexOf(key) is -1 then required.push key
          if typeAttr.indexOf('nullable') isnt -1
            schema.properties[key].nullable = true
      for name in required
        schema.properties[name].required = true
    else
      ref = dataStructures[root.element]
      if ref
        schema = renderSchema(inherit(ref, root), dataStructures)

  if root.attributes?.default?
    schema.default = root.attributes.default

  if root.meta?.id?
    schema.name = root.meta.id

  if root.meta?.description?
    schema.description = root.meta.description

  if root.attributes?.typeAttributes
    typeAttr = root.attributes.typeAttributes
    if typeAttr.indexOf('nullable') isnt -1
      schema.nullable = true

  schema
