const { realmcode, key, bannedgames, bannedtime, mingames, webhook, gamerscore, friends, followers } = require('./config.json');
const editJsonFile = require("edit-json-file");
const fs = require('fs');
const uuid = require('uuid');
const requestId = uuid.v4()
const bedrock = require('bedrock-protocol')
const { Authflow, Titles } = require('prismarine-auth')
const axios = require('axios');

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
          axios.get(`https://apiv2.economyplus.solutions/api/auth/${XUID}/${mingames}/${bannedtime}/${followers}/${friends}/${gamerscore}`, {
            headers: {
              'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`,
              'fairplay': key,
              'User-Agent': 'Axios/0.21.1'
            }
          }).then((res) => {
            console.log("Sent request")
            const username = res.data.ign
            const game1 = res.data.game1
            const pfp = res.data.pfp
            const reason = res.data.reason

            if (res.data.kick == true) {
              client.write('command_request', {
                command: `kick "${username}"  \n§8[§9Fairplay+§8]\n§8Reason: §r${reason}\n§8`,
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
Reason: **${reason}**
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


          }).catch((e) => {  });

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
