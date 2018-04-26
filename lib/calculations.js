const { DateTime } = require('luxon')

function precisionRound(number, precision) {
  const factor = 10 ** precision
  return Math.round(number * factor) / factor
}

function sumValue(ledger) {
  return ledger.reduce((acc, tx) => tx.value + acc, 0)
}

function calculateNet({ value, received, btcPrice, unbalanced = 0 }) {
  return {
    btc: value.btc - received - unbalanced,
    usd: (value.btc - received - unbalanced) * btcPrice,
  }
}

async function matchTransactions({ txMap, txLedger }) {
  return txMap.map(tx =>
    Object.assign(tx, {
      name: (txLedger.find(ltx => ltx.tx === tx.tx) || { name: null }).name,
    }),
  )
}

/*
* @param {start} DateTime a balance event in the past
* @param {days} Number number of days for balance intervals
*/
function nextBalanceDate({ start, days = 28 }) {
  const now = DateTime.local()
  let iter = start
  // while current date is after the iteration
  while (now > iter) {
    iter = iter.plus({ days })
  }
  return iter
}

function lastBalanceDate({ start, days = 28 }) {
  const next = nextBalanceDate({ start, days })
  return next.minus({ days })
}

function isDistributed({ last, transaction }) {
  // convert to ms, resolve to DateTime
  const txTime = DateTime.fromJSDate(new Date(transaction.blocktime * 1000))
  return txTime < last
}

module.exports = {
  isDistributed,
  precisionRound,
  sumValue,
  calculateNet,
  matchTransactions,
  nextBalanceDate,
  lastBalanceDate,
}
