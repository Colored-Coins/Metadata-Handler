var ini = require('iniparser')
var _ = require('lodash')
var MetaDataHandler = require(__dirname + '/../index.js')

var properties

try {
  var properties_default = ini.parseSync(__dirname + '/settings/properties_default.conf')
  var properties_custom
  try {
    properties_custom = ini.parseSync(__dirname + '/settings/properties.conf')
  } catch (e) {
    properties_custom = {}
  }
  properties = _.merge(properties_default, properties_custom)
} catch (e) {
  throw new Error('Missing properties')
}

var handler = new MetaDataHandler(properties)

console.log(handler)

handler.cliViewStatus = true
