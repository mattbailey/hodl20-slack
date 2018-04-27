const pino = require('pino')
const inquirer = require('inquirer')
const Bottleneck = require('bottleneck')
const { binance, getBinanceWallets } = require('./binance')

const log = pino({
  level: 'info',
  prettyPrint: true,
})

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 500,
})

async function liquidate({ sellFor = 'BTC' }) {
  // Filter out the coin we're liquidating to
  const wallets = (await getBinanceWallets()).filter(
    wallet => wallet.asset !== sellFor && wallet.asset !== 'BTC',
  )
  // Construct order requests
  const orders = wallets.map(wallet => {
    return {
      symbol: `${wallet.asset}${sellFor}`,
      side: 'SELL',
      type: 'MARKET',
      quantity: wallet.free,
      newOrderRespType: 'ACK',
    }
  })
  const limitedOrder = limiter.wrap(order => {
    log.info(`submitting ${order.symbol} ${order.side}: ${order.quantity}`)
    return binance
      .newOrder({ ...order, timestamp: new Date().getTime() })
      .catch(e => log.error(e))
  })
  const results = Promise.all(orders.map(limitedOrder))

  log.info(await results)
}

inquirer
  .prompt([
    {
      type: 'confirm',
      name: 'sure',
      message: `ARE YOU SURE YOU WANT TO LIQUIDATE ALL ASSETS TO ${process
        .argv[2] || 'BTC'}?`,
      default: false,
    },
  ])
  .then(
    answers =>
      answers.sure
        ? liquidate({ sellFor: process.argv[2] })
        : log.error('president notsure'),
  )
