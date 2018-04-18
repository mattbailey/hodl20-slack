const fs = require('fs-extra')
const readline = require('readline')
const google = require('googleapis').google
const authorize = require('./google_authorize')

async function initSheets() {
  const creds = await fs.readFile('client_secret.json')
  const auth = await authorize(JSON.parse(creds))
  return google.sheets({ version: 'v4', auth })
}

async function getTransactions(spreadsheetId) {
  const sheets = await initSheets()
  const values = (await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'tx!A1:B',
  })).data.values
  const ledger = values.map(row =>
    Object.assign({}, { tx: row[0], name: row[1] }),
  )
  return ledger
}

module.exports = { getTransactions }
