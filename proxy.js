const fs = require("fs");

function chat(client, message, messageChannel, messageThreadId) {
  fs.readFile(`./${message.guild.id}_profile_shift.json`, async (err, data) => {
    try {
      const swapJson = JSON.parse(data.toString());
      const newUserData = Object.entries(swapJson).find(u => u[0] == message.author.id);

      if (newUserData == undefined) return;

      client.users.fetch(newUserData[1]['id']).then(async (data) => {
        message.delete();
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

function chatCharacter(client, message, messageChannel, messageThreadId) {
  fs.readFile(`./${message.guild.id}_character_list.json`, async (err, data) => {
    try {
      const swapJson = JSON.parse(data.toString());
      const character = Object.entries(swapJson).find(u => u[0] == message.author.id);

      if (character == undefined) return;

      message.delete();
      webhook = await messageChannel.fetchWebhooks().then(webhook => webhook.find(wh => wh.owner.id == client.user.id));
      webhook.send({
        username: character[1].name,
        avatarURL: character[1].image,
        content: message.content,
        files: message.attachments.map(file => file.attachment),
        threadId: messageThreadId
      });
    } catch (error) {
      return;
    }
  });
}

function createCharacter(client, message) {
  let charName, charUser, charImage, characterListJson;

  try {
    charName = message.content.includes('<@') ? message.content.split('<@')[0] : message.content;
    charUser = message.member.roles.cache.some(x => x.name == 'Assigner') ? Array.from(message.mentions.users)[0][0] : message.author.id;
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