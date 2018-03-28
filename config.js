module.exports = {
  apiKey: process.env.API,
  discordToken: process.env.TOKEN,
  clans: [
    {
      tag: process.env.TAG,
      channelID: process.env.ID,
      color: 3447003
    }
  ],
  timeDelay: 90,
  showLeague: false,
  useRichEmbed: true
}
