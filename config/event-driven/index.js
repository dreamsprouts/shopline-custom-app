/**
 * Event-Driven 配置模組
 */

const config = require('./config')

function getEventConfig() {
  return config
}

module.exports = {
  ...config,
  getEventConfig
}

