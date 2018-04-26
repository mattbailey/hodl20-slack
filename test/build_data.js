import test from 'ava'
import buildData from '../lib/build_data'

test('buildDate', async t => {
  t.snapshot(await buildData({ address: process.env.WALLET_ADDRESS }))
})
