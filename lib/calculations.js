function precisionRound(number, precision) {
  const factor = 10 ** precision
  return Math.round(number * factor) / factor
}

function sumValue(ledger) {
  return ledger.reduce((acc, tx) => tx.value + acc, 0)
}

function calculateNet({ value, received, btcPrice }) {
  return { btc: value.btc - received, usd: (value.btc - received) * btcPrice }
}

async function matchTransactions({ txMap, txLedger }) {
  return txMap.map(tx =>
    Object.assign(tx, {
      name: (txLedger.find(ltx => ltx.tx === tx.tx) || { name: null }).name,
    }),
  )
}

module.exports = { precisionRound, sumValue, calculateNet, matchTransactions }
