const fetch = require('node-fetch')

async function getWallet(address) {
  const res = await fetch(`https://blockexplorer.com/api/addr/${address}`)
  return res.json()
}

const getTxValue = tx =>
  tx.res.vout
    .filter(tr => tr.scriptPubKey && tr.scriptPubKey.addresses)
    .reduce(
      (acc, next) =>
        next.scriptPubKey.addresses.includes(tx.address)
          ? acc + parseFloat(next.value)
          : acc,
      0,
    )

async function getTx({ address, tx }) {
  try {
    const res = await fetch(`https://blockexplorer.com/api/tx/${tx}`)
    return {
      res: await res.json(),
      address,
      tx,
    }
  } catch (e) {
    console.error(e)
  }
  return {}
}

module.exports = { getTx, getWallet, getTxValue }
