const { precisionRound, sumValue } = require('./calculations')

function processUsers({ received, transactions, net, btcPrice, balanced }) {
  const users = transactions
    .map(tx => tx.name)
    .filter(el => (el in this ? false : (this[el] = true))) // eslint-disable-line
  return users.map(name => {
    // How much invested & percent of total invested
    const invested = sumValue(transactions.filter(tx => tx.name === name))
    const distributed = sumValue(
      transactions.filter(tx => tx.name === name).filter(tx => tx.distributed),
    )
    const percentInvested = invested / received
    const percentDistributed = distributed / balanced
    // Gains calculation
    const gains = percentDistributed * net.btc
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

module.exports = processUsers
