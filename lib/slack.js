const fetch = require('node-fetch')
const gencolor = require('string-to-color')
const { precisionRound } = require('./calculations')

function slack(message) {
  fetch(process.env.SLACK_HOOK, {
    method: 'POST',
    body: JSON.stringify({
      text: message.text,
      attachments: message.attachments,
      username: 'HODL20',
      icon_emoji: ':buttcoin:',
    }),
  })
}

function slackFieldFilter(inv) {
  return [
    {
      short: true,
      value: `_Invested:_ *${inv.invested}*`,
    },
    {
      short: true,
      value: `_Gainz:_ *${inv.gains}*[$${inv.gainsValue}]`,
    },
  ]
}

function formatSlackMessage(data) {
  const gains = data.users.map(gain =>
    Object.assign(
      {},
      {
        title: `${gain.name} - ${gain.percentOfInvestment}% of fund`,
        color: gencolor(gain.name),
        mrkdwn_in: ['text', 'pretext', 'fields'],
        fields: slackFieldFilter(gain),
      },
    ),
  )

  const message = {
    text: [
      `_BTC @ $${data.btcPrice}_`,
      `Fund Value: *${precisionRound(data.value.btc, 5)}*[$${data.value.usd}]`,
      `Invested: *${precisionRound(data.received, 5)}*, Net: *${precisionRound(
        data.net.btc,
        5,
      )}*[$${precisionRound(data.net.usd, 0)}]`,
    ].join('\n'),
    attachments: gains,
    mrkdwn: true,
  }

  return message
}

module.exports = { formatSlackMessage, slack, slackFieldFilter }
