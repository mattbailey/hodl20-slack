#!/usr/bin/env node

const Binance = require('binance')
const Bottleneck = require('bottleneck')
const fetch = require('node-fetch')
const gencolor = require('string-to-color')
const { getTransactions } = require('./lib/readsheet')
const { getWallet, getTxValue } = require('./lib/blockchain')

const BINANCE_KEY = process.env.BINANCE_KEY
const BINANCE_SECRET = process.env.BINANCE_SECRET
const SLACK_HOOK = process.env.SLACK_HOOK
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const GOOGLE_SHEET = process.env.GOOGLE_SHEET

const binance = new Binance.BinanceRest({
  key: BINANCE_KEY,
  secret: BINANCE_SECRET,
})

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 500,
})

function precisionRound(number, precision) {
  const factor = Math.pow(10, precision)
  return Math.round(number * factor) / factor
}

async function getPricemap() {
  let prices
  try {
    prices = await binance.tickerPrice()
  } catch (e) {
    console.error(e)
  }
  const pricemap = prices.reduce(
    (state, next) =>
      Object.assign(state, { [next.symbol]: parseFloat(next.price) }),
    {},
  )
  return pricemap
}

async function getvalue() {
  let account
  let pricemap
  try {
    account = await binance.account()
    pricemap = await getPricemap()
  } catch (e) {
    console.error(e)
  }
  const wallet = account.balances
    .map(asset =>
      Object.assign({ asset: asset.asset }, { free: parseFloat(asset.free) }),
    )
    .filter(asset => asset.free > 0)
    .map(asset => {
      const price = pricemap[`${asset.asset}BTC`] || 1
      return { ...asset, ...{ btc: price * asset.free } }
    })

  const btc = wallet.reduce((acc, asset) => asset.btc + acc, 0)

  const btcValue = pricemap.BTCUSDT

  const usd = Math.round(btcValue * btc)

  return { btc, usd }
}

function slack(message) {
  fetch(SLACK_HOOK, {
    method: 'POST',
    body: JSON.stringify({
      text: message.text,
      attachments: message.attachments,
      username: 'HODL20',
      icon_emoji: ':buttcoin:',
    }),
  })
}

function slackFieldFilter(inv) {
  return [
    {
      short: true,
      value: `_Invested:_ *${inv.invested}*`,
    },
    {
      short: true,
      value: `_Gainz:_ *${inv.gains}*[\$${inv.gainsValue}]`,
    },
  ]
}

async function matchTransactions({ txMap, txLedger }) {
  return txMap.map(tx =>
    Object.assign(tx, {
      name: (txLedger.find(ltx => ltx.tx === tx.tx) || { name: null }).name,
    }),
  )
}

function sumValue(ledger) {
  return ledger.reduce((acc, tx) => tx.value + acc, 0)
}

function calculateNet({ value, received, btcPrice }) {
  return { btc: value.btc - received, usd: (value.btc - received) * btcPrice }
}

function processUsers({ received, transactions, net, btcPrice }) {
  const users = transactions
    .map(tx => tx.name)
    .filter(el => (el in this ? false : (this[el] = true)))
  return users.map(name => {
    // How much invested & percent of total invested
    const invested = sumValue(transactions.filter(tx => tx.name === name))
    const percentInvested = invested / received
    // Gains calculation
    const gains = percentInvested * net.btc
    const gainsValue = precisionRound(gains * btcPrice, 0)
    // invested value
    const investedValue = precisionRound(invested * btcPrice, 0)
    return {
      invested: precisionRound(invested, 5),
      investedValue,
      percentOfInvestment: precisionRound(percentInvested * 100, 2),
      gains: precisionRound(gains, 5),
      gainsValue,
      name,
    }
  })
}

async function buildData({ address }) {
  // get current BTC Price vs USDT
  const btcPrice = (await getPricemap()).BTCUSDT
  // Get ledger from gdocs
  const txLedger = await getTransactions(GOOGLE_SHEET)
  // Get mapping of all transactions for wallet
  const transactions = await Promise.all(
    txLedger.map(async tx =>
      Object.assign(tx, { value: await getTxValue({ address, tx: tx.tx }) }),
    ),
  )
  // add up ledger tx values
  const received = sumValue(transactions)
  // Get binance account value
  const value = await getvalue()
  // calculate net BTC/USD gain
  const net = calculateNet({ value, received, btcPrice })
  const users = await processUsers({ received, transactions, net, btcPrice })
  return {
    btcPrice,
    received,
    net,
    value,
    transactions,
    users,
  }
}

async function main() {
  const data = await buildData({ address: WALLET_ADDRESS })

  const gains = data.users.map(gain =>
    Object.assign(
      {},
      {
        title: `${gain.name} - ${gain.percentOfInvestment}% of fund`,
        color: gencolor(gain.name),
        mrkdwn_in: ['text', 'pretext', 'fields'],
        fields: slackFieldFilter(gain),
      },
    ),
  )

  const message = {
    text: [
      `_BTC @ \$${data.btcPrice}_`,
      `Fund Value: *${precisionRound(data.value.btc, 5)}*[\$${data.value.usd}]`,
      `Invested: *${precisionRound(data.received, 5)}*, Net: *${precisionRound(
        data.net.btc,
        5,
      )}*[\$${precisionRound(data.net.usd, 0)}]`,
    ].join('\n'),
    attachments: gains,
    mrkdwn: true,
  }

  slack(message)
}

try {
  main()
} catch (e) {
  console.error(e)
}
