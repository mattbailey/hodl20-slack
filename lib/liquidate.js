const pino = require('pino')
const inquirer = require('inquirer')
const Bottleneck = require('bottleneck')
const { stepRectify } = require('./calculations')
const { binance, getBinanceWallets, getLotFilter } = require('./binance')

const log = pino({
  level: 'info',
  prettyPrint: true,
})

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 500,
})

async function liquidate({ sellFor = 'BTC' }) {
  const filters = await getLotFilter()
  // Filter out the coin we're liquidating to
  const wallets = (await getBinanceWallets()).filter(
    wallet => wallet.asset !== sellFor && wallet.asset !== 'BTC',
  )
  // Construct order requests
  const orders = wallets.map(wallet => {
    const symbol = `${wallet.asset}${sellFor}`
    const filter = filters[symbol] || { stepSize: 1 }
    const quantity = stepRectify({
      quantity: wallet.free,
      stepSize: filter.stepSize,
    })
    return {
      symbol,
      quantity,
      side: 'SELL',
      type: 'MARKET',
      newOrderRespType: 'ACK',
    }
  })
  const limitedOrder = limiter.wrap(order => {
    log.info(`submitting ${order.symbol} ${order.side}: ${order.quantity}`)
    return binance
      .testOrder({ ...order, timestamp: new Date().getTime() })
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
