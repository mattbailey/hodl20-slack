const fs = require('fs-extra')
const inquirer = require('inquirer')
const google = require('googleapis').google
const OAuth2Client = google.auth.OAuth2
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const TOKEN_PATH = 'credentials.json'
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new OAuth2Client(
    client_id,
    client_secret,
    redirect_uris[0],
  )

  // Check if we have previously stored a token.
  let token
  try {
    token = JSON.parse(await fs.readFile(TOKEN_PATH))
  } catch (e) {
    token = await getNewToken(oAuth2Client)
  }
  oAuth2Client.setCredentials(token)
  return oAuth2Client
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const { code } = await inquirer.prompt([
    { type: 'input', name: 'code', message: 'Enter the verification code' },
  ])
  const token = (await oAuth2Client.getToken(code)).tokens
  // Store the token to disk for later program executions
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
    if (err) console.error(err)
    console.log('Token stored to', TOKEN_PATH)
  })
  return token
}

module.exports = authorize
