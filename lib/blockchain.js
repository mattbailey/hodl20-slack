const fetch = require('node-fetch')

async function getWallet(address) {
  const res = await fetch(`https://blockexplorer.com/api/addr/${address}`)
  return res.json()
}

async function getTxValue({ address, tx }) {
  const res = await fetch(`https://blockexplorer.com/api/tx/${tx}`)
  const transaction = await res.json()
  const value = transaction.vout
    .filter(tr => tr.scriptPubKey && tr.scriptPubKey.addresses)
    .reduce(
      (acc, next) =>
        next.scriptPubKey.addresses.includes(address)
          ? acc + parseFloat(next.value)
          : acc,
      0,
    )
  return value
}

module.exports = { getWallet, getTxValue }
