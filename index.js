#!/usr/bin/env node

require('dotenv').config()
const { formatSlackMessage, slack } = require('./lib/slack')
const buildData = require('./lib/build_data')

async function main() {
  const data = await buildData({ address: process.env.WALLET_ADDRESS })
  const message = formatSlackMessage(data)
  slack(message)
}

try {
  main()
} catch (e) {
  console.error(e)
}
