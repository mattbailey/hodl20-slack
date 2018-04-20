const { getPricemap, getBinanceValue } = require('./binance')
const { getTransactions } = require('./readsheet')
const { sumValue, calculateNet } = require('./calculations')
const { getTxValue } = require('./blockchain')
const processUsers = require('./process_users')

async function buildData({ address }) {
  // get current BTC Price vs USDT
  const btcPrice = (await getPricemap()).BTCUSDT
  // Get ledger from gdocs
  const txLedger = await getTransactions(process.env.GOOGLE_SHEET)
  // Get mapping of all transactions for wallet
  const transactions = await Promise.all(
    txLedger.map(async tx =>
      Object.assign(tx, { value: await getTxValue({ address, tx: tx.tx }) }),
    ),
  )
  // add up ledger tx values
  const received = sumValue(transactions)
  // Get binance account value
  const value = await getBinanceValue()
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

module.exports = buildData
