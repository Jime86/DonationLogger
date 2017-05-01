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
var config           = require('./config.json');
var memberDonateList = {};
var textChannel;
var timer;
var errorCount = 0;

var DEBUG = false;

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
function timerUpdate() {
    var options = {
        'uri': 'https://api.clashofclans.com/v1/clans/' + config.clanTag.toUpperCase().replace(/O/g, '0').replace(/#/g, '%23'),
        'method': 'GET',
        'headers': {
            'Accept': 'application/json',
            'authorization': 'Bearer ' + config.apiKey,
            'Cache-Control':'no-cache'
        },
        'json': true
    }
    debug(options);
    clearTimeout(timer);
    rp(options)
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
            if (player.tag in memberDonateList) {
                var league = "";
                if (config.showLeague) league = getLeagueFromID(player.league.id)  + " " ;
                var diffDonations = player.donations - memberDonateList[player.tag].donations;
                if (diffDonations) {
                    donatedMsg += league + player.name + " (" + player.tag + ") : " + diffDonations + "\n";
                }
                var diffReceived = player.donationsReceived - memberDonateList[player.tag].donationsReceived;
                if (diffReceived) {
                    receivedMsg += league + player.name + " (" + player.tag + ") : " + diffReceived + "\n";
                }
            }
        }
        //Send Message if any donations exist
        if (donatedMsg!="" || receivedMsg!="") {
            var embedObj = {
                color: 3447003,
                fields: [{
                    name: 'Donated troops or spells:',
                    value: ''
                },
                {
                    name: 'Recieved troops or spells:',
                    value: ''
                }
                ],
                footer: {
                    text: ''
                }
            };
            embedObj.fields[0].value = donatedMsg;
            embedObj.fields[1].value = receivedMsg;
            embedObj.footer.text = new Date().toUTCString();
            textChannel.sendEmbed(embedObj);
        }
        //Update member list data(purges members that have left)
        memberDonateList = [];
        for (var i = 0; i < clan.members; i++) {
            var player = clan.memberList[i];
            memberDonateList[player.tag] = player;
        }
        //set timer again
        timer = setTimeout(timerUpdate, config.timeDelay * 1000);
    })
    .catch(err => {
        debug(err);
        errorCount++;
        if (errorCount < 30) {
            timer = setTimeout(timerUpdate, config.timeDelay * 1000 * errorCount); // progressively lengthens
        } else {
            debug("Bot could not recover");
        }
    });
}


client.on('ready', () => {
    debug("Starting");
    memDonateList = [];
    errorCount = 0;
    if (client.channels.has(config.channelID)) {
        textChannel = client.channels.get(config.channelID);
        timerUpdate();
    } else {
        debug("Error: Channel Not found!");
    }
});

client.login(config.discordToken);