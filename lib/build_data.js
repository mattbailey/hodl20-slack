const { getPricemap, getBinanceValue } = require('./binance')
const { DateTime } = require('luxon')
const { getTransactions } = require('./readsheet')
const {
  sumValue,
  calculateNet,
  isDistributed,
  lastBalanceDate,
  nextBalanceDate,
} = require('./calculations')
const { getTxValue, getTx } = require('./blockchain')
const processUsers = require('./process_users')

async function buildData({ address }) {
  // get current BTC Price vs USDT
  const btcPrice = (await getPricemap()).BTCUSDT
  // Get ledger from gdocs
  const txLedger = await getTransactions(process.env.GOOGLE_SHEET)
  // rebalancing information
  const firstTrade = DateTime.fromRFC2822('10 Apr 2018 07:33:00 PDT')
  const last = lastBalanceDate({ start: firstTrade })
  const nextBalance =
    nextBalanceDate({ start: firstTrade })
      .toJSDate()
      .getTime() / 1000
  // Get mapping of all transactions for wallet
  const transactions = await Promise.all(
    txLedger.map(async tx => {
      const txData = await getTx({ address, tx: tx.tx })
      return {
        ...tx,
        ...{
          blocktime: txData.res.blocktime,
          value: getTxValue(txData),
          distributed: isDistributed({ last, transaction: txData.res }),
        },
      }
    }),
  )
  const balancedTx = transactions.filter(transaction =>
    isDistributed({ last, transaction }),
  )
  // add up ledger tx values
  const received = sumValue(transactions)
  const balanced = sumValue(balancedTx)
  // Get binance account value
  const value = await getBinanceValue()
  // calculate net BTC/USD gain
  const net = calculateNet({
    value,
    received,
    btcPrice,
  })
  const users = await processUsers({
    received,
    balanced,
    transactions,
    net,
    btcPrice,
  })
  return {
    nextBalance,
    btcPrice,
    received,
    net,
    value,
    transactions,
    users,
  }
}

module.exports = buildData
