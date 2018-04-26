import test from 'ava'
import { DateTime } from 'luxon'
import { isDistributed, lastBalanceDate } from '../lib/calculations'

/*
const transaction = {
  res: {
    txid: '123',
    version: 1,
    locktime: 0,
    vin: [
      {
        txid: '123',
        vout: 0,
        scriptSig: {
          asm: '123',
          hex: '123',
        },
        sequence: 123,
        n: 0,
        addr: '123',
        valueSat: 123,
        value: 123,
        doubleSpentTxID: null,
      },
    ],
    vout: [
      {
        value: '0.123',
        n: 0,
        scriptPubKey: {
          hex: '123',
          asm: '0 123',
        },
        spentTxId: '123',
        spentIndex: 0,
        spentHeight: 123,
      },
      {
        value: '1.123',
        n: 1,
        scriptPubKey: {
          hex: '123',
          asm: 'OP_DUP OP_HASH160 123 OP_EQUALVERIFY OP_CHECKSIG',
          addresses: ['123'],
          type: 'pubkeyhash',
        },
        spentTxId: null,
        spentIndex: null,
        spentHeight: null,
      },
    ],
    blockhash: '123',
    blockheight: 123,
    confirmations: 123,
    time: 1523369300,
    blocktime: 1523369300,
    valueOut: 1.123,
    size: 1,
    valueIn: 1.123,
    fees: 2.0e-5,
  },
}
*/

test('isDistributed should return true if the transaction was made before the last fund redistribution', async t => {
  const firstTrade = DateTime.fromRFC2822('10 Apr 2018 07:33:00 PDT')
  const last = lastBalanceDate({ start: firstTrade })
  t.true(isDistributed({ last, transaction: { blocktime: 1523370399 } }))
})

test('isDistributed should return false if the transaction was made after the last fund redistribution', async t => {
  const firstTrade = DateTime.fromRFC2822('10 Apr 2018 07:33:00 PDT')
  const last = lastBalanceDate({ start: firstTrade })
  t.false(isDistributed({ last, transaction: { blocktime: 1523382118 } }))
})
