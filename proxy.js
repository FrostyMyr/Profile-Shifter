const fs = require("fs");
const config = require("./config.json");

function chatTemplate(client, message, chatJson) {
  fs.readFile(chatJson, async (err, data) => {
    try {
      const swapJson = JSON.parse(data.toString());
      const newUserData = Object.entries(swapJson).find(u => u[0] == message.author.id);

      if (newUserData == undefined) return;

      client.users.fetch(newUserData[1]['id']).then(async (data) => {
        message.delete();

        let messageChannel = message.channel;
        let messageThreadId = null;
        if (message.channel.type == 11 || message.channel.type == 12) {
          messageChannel = await client.channels.fetch(message.channel.parentId);
          messageThreadId = message.channel.id;
        }
        
        let webhook = await messageChannel.fetchWebhooks().then(webhook => webhook.find(wh => wh.owner.id == client.user.id));
        if (!webhook) messageChannel.createWebhook({ name: "Profile Shifter" });
        
        webhook = await messageChannel.fetchWebhooks().then(webhook => webhook.find(wh => wh.owner.id == client.user.id));
        webhook.send({
          username: data.globalName,
          avatarURL: data.displayAvatarURL(),
          content: message.content,
          files: message.attachments.map(file => file.attachment),
          threadId: messageThreadId
        });
      });
    } catch (error) {
      return;
    }
  });
}

function chat(client, message) {
  chatTemplate(client, message, `./${message.guild.id}_profile_shift.json`);
}

function chatCharacter(client, message) {
  chatTemplate(client, message, `./${message.guild.id}_character_list.json`);
}

function createCharacter(client, message) {
  let charName, charUser, charImage, characterListJson;

  try {
    charName = message.content.split('<@')[0];
    charUser = Array.from(message.mentions.users)[0][0];
    charImage = Array.from(message.attachments)[0][1]['url'];
  } catch (error) {
    return;
  }

  try {
    characterListJson = JSON.parse(fs.readFileSync(`./${message.guild.id}_character_list.json`));
  } catch (error) {
    fs.writeFileSync(`./${message.guild.id}_character_list.json`, '{}');
    characterListJson = JSON.parse(fs.readFileSync(`./${message.guild.id}_character_list.json`));
  }

  const newCharacterListJson = Object.assign({}, characterListJson, {
    [charUser]: {
      "name": charName,
      "image": charImage,
    }
  });
  fs.writeFileSync(`./${message.guild.id}_character_list.json`, JSON.stringify(newCharacterListJson, null, 2));
  
  message.react('✅');
}

function deleteCharacter(client, message) {
  try {
    let characterListJson;

    try {
      characterListJson = JSON.parse(fs.readFileSync(`./${message.guild.id}_character_list.json`));
    } catch (error) {
      fs.writeFileSync(`./${message.guild.id}_character_list.json`, '{}');
      characterListJson = JSON.parse(fs.readFileSync(`./${message.guild.id}_character_list.json`));
    }

    const newCharacterListJson = Object.entries(characterListJson).filter(x => x[0] != message.author.id);
    const objectNewCharacterListJson = Object.fromEntries(newCharacterListJson)

    fs.writeFileSync(`./${message.guild.id}_character_list.json`, JSON.stringify(objectNewCharacterListJson, null, 2));
  } catch (error) {
    return;
  }
}

module.exports = { chat, chatCharacter, createCharacter, deleteCharacter };