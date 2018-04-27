const Binance = require('binance')

const binance = new Binance.BinanceRest({
  key: process.env.BINANCE_KEY,
  secret: process.env.BINANCE_SECRET,
})

async function getPricemap() {
  let prices
  try {
    prices = await binance.bookTicker()
  } catch (e) {
    console.error(e)
  }
  const pricemap = prices.reduce(
    (state, next) =>
      Object.assign(state, { [next.symbol]: parseFloat(next.bidPrice) }),
    {},
  )
  return pricemap
}

async function getLotFilter() {
  const { symbols } = await binance.exchangeInfo()
  return symbols.reduce(
    (state, next) =>
      Object.assign(state, {
        [next.symbol]: next.filters.find(
          filter => filter.filterType === 'LOT_SIZE',
        ),
      }),
    {},
  )
}

async function getBinanceWallets() {
  let account
  try {
    account = await binance.account()
  } catch (e) {
    console.error(e)
  }
  return account.balances
    .map(asset =>
      Object.assign({ asset: asset.asset }, { free: parseFloat(asset.free) }),
    )
    .filter(asset => asset.free > 0)
}

async function getBinanceValue() {
  let pricemap
  try {
    pricemap = await getPricemap()
  } catch (e) {
    console.error(e)
  }

  const wallet = (await getBinanceWallets()).map(asset => {
    const price = pricemap[`${asset.asset}BTC`] || 1
    return { ...asset, ...{ btc: price * asset.free } }
  })

  const btc = wallet.reduce((acc, asset) => asset.btc + acc, 0)

  const btcValue = pricemap.BTCUSDT

  const usd = Math.round(btcValue * btc)

  return { btc, usd }
}

module.exports = {
  getBinanceValue,
  binance,
  getPricemap,
  getBinanceWallets,
  getLotFilter,
}
