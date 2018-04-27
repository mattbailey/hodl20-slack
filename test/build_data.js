import test from 'ava'
import buildData from '../lib/build_data'

test('buildDate', async t => {
  const res = await buildData({ address: process.env.WALLET_ADDRESS })
  t.true(res.transactions.length > 2)
})
