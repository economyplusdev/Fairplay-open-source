const { realmcode, key, bannedgames, bannedtime, mingames, webhook } = require('./config.json');
const editJsonFile = require("edit-json-file");
const fs = require('fs');
const uuid = require('uuid');
const requestId = uuid.v4()
const bedrock = require('bedrock-protocol')
const { Authflow, Titles } = require('prismarine-auth')
const axios = require('axios');
const { start } = require('repl');

const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook(webhook);


//Define your auhtflow
new Authflow('', `./bot/auth`, { relyingParty: 'https://pocket.realms.minecraft.net/' }).getXboxToken().then(async (t) => {
  const auth3 = JSON.parse(JSON.stringify({
    'Client-Version': '0.0.0',
    'User-Agent': 'MCPE/UWP',
    Authorization: `XBL3.0 x=${t.userHash};${t.XSTSToken}`
  }))
  new Authflow('', `./bot/auth`, { relyingParty: 'http://xboxlive.com' }).getXboxToken().then(async (t) => {
    const auth = JSON.parse(JSON.stringify({
      'x-xbl-contract-version': '2',
      'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`,
      'Accept-Language': "en-US"
    }))
    start()

    function start() {

      const client = bedrock.createClient({
        realms: {
          realmInvite: realmcode,
        }
      })

      let whitelist = editJsonFile(`./whitelist.json`);
      const whitelistdb = whitelist.get("whitelist")


      client.on('player_list', async (player) => {
        // console.log(player.records.records[0].xbox_user_id)
        // console.log(player.records.records[0].username)
        const XUID = player.records.records[0].xbox_user_id
        const usernamecheck = player.records.records[0].username
        if (player !== player.records.type === "add") {
          return console.log("skipping packet")
        }
        console.log("user on whitelist", whitelistdb?.includes(XUID))
        if (XUID !== undefined && !whitelistdb?.includes(XUID) && XUID !== client.profile.xuid) {
          console.log("User joined:", XUID, usernamecheck)
          axios.get(`https://apiv2.economyplus.solutions/api/auth/${XUID}`, {
            headers: {
              'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`,
              'fairplay': key,
              'User-Agent': 'Axios 0.21.1'
            }
          }).then((res) => {

            console.log("Sent request")
            const username = res.data.ign
            const game1 = res.data.game1
            const pfp = res.data.pfp

            const andriod = res.data.andriod
            const launcher = res.data.launcher
            const windows = res.data.windows
            const kindle = res.data.kindle

            const andriodt = res.data.time1
            const launchert = res.data.time2
            const windowst = res.data.time3
            const kindlet = res.data.time4


            if (res.data.private == true) {


              client.write('command_request', {
                command: `kick "${username}"  \n§8[§9Fairplay+§8]\n§8Reason: §rProfile is private\n§8`,
                origin: {
                  type: 0,
                  uuid: '',
                  request_id: '',
                },
              });

              const embed = new MessageBuilder()
                .setTitle('Fairplay AC')
                .setColor(16408415)
                .setThumbnail(pfp)
                .setDescription(`
User kicked
Username: **${username}**
XUID: **${XUID}**
Reason: **User has profile as private**
`)
                .setTimestamp();
              return hook.send(embed);
            }


            const gamesowned = res.data.gamesowned
            if (mingames => gamesowned) {
              client.write('command_request', {
                command: `kick "${username}"  \n§8[§9Fairplay+§8]\n§8Reason: §rYou do not have enough games owned to play this server\n§8`,
                origin: {
                  type: 0,
                  uuid: '',
                  request_id: '',
                },
              });

              const embed = new MessageBuilder()
                .setTitle('Fairplay AC')
                .setColor(16408415)
                .setThumbnail(pfp)
                .setDescription(`
User kicked
Username: **${username}**
XUID: **${XUID}**
Reason: **User does not have enough games to join this server**
`)
                .setTimestamp();
              return hook.send(embed);

            }

            if (andriod == true && andriodt >= bannedtime || launcher == true && launchert >= bannedtime || windows == true && windowst >= bannedtime || kindle == true && kindlet >= bannedtime) {
              client.write('command_request', {
                command: `kick "${username}"  \n§8[§9Fairplay+§8]\n§8Reason: §rRecently playing a banned device\n§8`,
                origin: {
                  type: 0,
                  uuid: '',
                  request_id: '',
                },
              });
              const embed = new MessageBuilder()
                .setTitle('Fairplay AC')
                .setColor(16408415)
                .setThumbnail(pfp)
                .setDescription(`
User kicked
Username: **${username}**
XUID: **${XUID}**
Reason: **Recently played a banned device**
`)
                .setTimestamp();
              return hook.send(embed);
            }



            if (bannedgames.includes(game1)) {
              console.log("user is on banned device")
              client.write('command_request', {
                command: `kick "${username}"  \n§8[§9Fairplay+§8]\n§8Reason: §rJoining on a banned device\n§8Device: ${game1}`,
                origin: {
                  type: 0,
                  uuid: '',
                  request_id: '',
                },
              });
              const embed = new MessageBuilder()
                .setTitle('Fairplay AC')
                .setColor(16408415)
                .setThumbnail(pfp)
                .setDescription(`
User kicked
Username: **${username}**
XUID: **${XUID}**
Reason: **Joining on a banned device**
Device: **${game1}**
`)
                .setTimestamp();
              return hook.send(embed);
            }




          }).catch((e) => { console.log(`Error - Sending request`); console.log(e) });

        }


      })


      client.on('error', (error) => {
        console.log(error)
      })

      client.on('close', (msg) => {
        setTimeout(() => {
          start()
        }, "1000")
      })

    }

  })
})