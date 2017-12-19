/* Donation Logger
 * by Jim e
 * -------------------------------
 * Requires 
 *  - discord.js
 *  - request-promise
 */

var discord          = require('discord.js');
var client           = new discord.Client();
var rp               = require('request-promise');
var config           = require('./config');
var memberDonateList = [];
var textChannels = [];
var timers = [];
var options = [];
var errorCount = 0;

var DEBUG = true;

var leagueStrings = [
    "<:Unranked:293677521503911936>",
    "<:Bronze:293677521222762507>",
    "<:Bronze:293677521222762507>",
    "<:Bronze:293677521222762507>",
    "<:Silver:293677521642192896>",
    "<:Silver:293677521642192896>",
    "<:Silver:293677521642192896>",
    "<:Gold:293677521080418307>",
    "<:Gold:293677521080418307>",
    "<:Gold:293677521080418307>",
    "<:Crystal:293677521139007488>",
    "<:Crystal:293677521139007488>",
    "<:Crystal:293677521139007488>",
    "<:Master:293677521034018816>",
    "<:Master:293677521034018816>",
    "<:Master:293677521034018816>",
    "<:Champion:293688636992520193>",
    "<:Champion:293688636992520193>",
    "<:Champion:293688636992520193>",
    "<:Titan:293677520480370690>",
    "<:Titan:293677520480370690>",
    "<:Titan:293677520480370690>",
    "<:Legend:293677520497147905>",
    "<:Legend:293677520497147905>",
    "<:Legend:293677520497147905>",
    "<:Legend:293677520497147905>"
];

function debug( msg ) {
    if (DEBUG) console.log(msg);
}


function getLeagueFromID( id ) {
    if (id < 29000000) id = 29000000;
    if (id > 29000024) id = 29000024;
    return leagueStrings[id - 29000000];
}


//Timer function, Updates memberlist info and logs changes to discord and console
function timerUpdate( index ) {
    clearTimeout(timers[index]);
    rp(options[index])
    .then(clan => {
        if (errorCount > 0) {
            debug("Bot is online.");
            errorCount = 0;
        }
        // Build donation message
        var donatedMsg = "";
        var receivedMsg = "";
        for (var i = 0; i < clan.members; i++) {
            var player = clan.memberList[i];
            if (player.tag in memberDonateList[index]) {
                var league = "";
                if (config.showLeague) league = getLeagueFromID(player.league.id)  + " " ;
                var diffDonations = player.donations - memberDonateList[index][player.tag].donations;
                if (diffDonations) {
                    donatedMsg += league + player.name + " (" + player.tag + ") : " + diffDonations + "\n";
                }
                var diffReceived = player.donationsReceived - memberDonateList[index][player.tag].donationsReceived;
                if (diffReceived) {
                    receivedMsg += league + player.name + " (" + player.tag + ") : " + diffReceived + "\n";
                }
            }
        }
        //Send Message if any donations exist
        if (donatedMsg!="" || receivedMsg!="") {
            if (config.useRichEmbed) {
                const embedObj = new discord.RichEmbed()
                    .setColor(config.clans[index].color)
                    .addField('Donated troops or spells:',donatedMsg, false)
                    .addField('Recieved troops or spells:', receivedMsg, false)
                    .setFooter(new Date().toUTCString());
                textChannels[index].send(embedObj);
            } else {
                textChannels[index].send(
                    '**Donated troops or spells:**\n' +
                    donatedMsg +
                    '**Recieved troops or spells:**\n' + 
                    receivedMsg + 
                    "*" + new Date().toUTCString() + "*\n\n");
            }
        }
        //Update member list data(purges members that have left)
        memberDonateList[index] = [];
        for (var i = 0; i < clan.members; i++) {
            var player = clan.memberList[i];
            memberDonateList[index][player.tag] = player;
        }
        //set timer again
        timers[index] = setTimeout(timerUpdate, config.timeDelay * 1000, index);
    })
    .catch(err => {
        debug(err);
        errorCount++;
        if (errorCount > 30) {
            debug("Bot could not recover");
            errorCount = 30;
        }
        timers[index] = setTimeout(timerUpdate, config.timeDelay * 1000 * errorCount, index); // progressively lengthens
    });
}


client.on('ready', () => {
    debug("ready");
    errorCount = 0;
    timers = new Array(config.clans.length);
    textChannels = new Array(config.clans.length);
    options = new Array(config.clans.length);
    memberDonateList = new Array(config.clans.length);
    for(var i = 0; i < config.clans.length; i++ ) {
        debug(config.clans[i]);
        if (client.channels.has(config.clans[i].channelID)) {
            textChannels[i] = client.channels.get(config.clans[i].channelID);
            options[i] = {
                'uri': 'https://api.clashofclans.com/v1/clans/' + config.clans[i].tag.toUpperCase().replace(/O/g, '0').replace(/#/g, '%23'),
                'method': 'GET',
                'headers': {
                    'Accept': 'application/json',
                    'authorization': 'Bearer ' + config.apiKey,
                    'Cache-Control':'no-cache'
                },
                'json': true
            };
            debug(options[i].uri);
            memberDonateList[i] = [];
            timerUpdate(i);
        } else {
            debug("Error: Channel (" + config.clans[i].channelID + ") Not found!");
        }
    }
});

client.login(config.discordToken);
