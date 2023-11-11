const fs = require("fs");

function chat(client, message) {
  fs.readFile('./profile_shift.json', async (err, data) => {
    const swapJson = JSON.parse(data.toString());
    const newUserData = Object.entries(swapJson).find(u => u[0] == message.author.id);

    if (newUserData == undefined) return;

    client.users.fetch(newUserData[1]['id']).then(async (data) => {
      message.delete();
      const webhook = await message.channel.fetchWebhooks().then(webhook => webhook.find(wh => wh.owner.id == client.user.id));
      webhook.send({
        username: data.globalName,
        avatarURL: data.displayAvatarURL(),
        content: message.content,
        files: message.attachments.map(file => file.attachment)
      });
    });
  });
}

function chatCharacter(client, message) {
  fs.readFile('./character_list.json', async (err, data) => {
    const swapJson = JSON.parse(data.toString());
    const character = Object.entries(swapJson).find(u => u[0] == message.author.id);

    if (character == undefined) return;

    message.delete();
    const webhook = await message.channel.fetchWebhooks().then(webhook => webhook.find(wh => wh.owner.id == client.user.id));
    webhook.send({
      username: character[1].name,
      avatarURL: character[1].image,
      content: message.content,
      files: message.attachments.map(file => file.attachment)
    });
  });
}

function createCharacter(client, message) {
  try {
    const charName = message.content.split('<@')[0];
    const charUser = Array.from(message.mentions.users)[0][0];
    const charImage = Array.from(message.attachments)[0][1]['url'];
    
    const characterListJson = JSON.parse(fs.readFileSync(`./character_list.json`));
    const newCharacterListJson = Object.assign({}, characterListJson, {
      [charUser]: {
        "name": charName,
        "image": charImage,
      }
    });
    fs.writeFileSync(`./character_list.json`, JSON.stringify(newCharacterListJson, null, 2));
    
    message.react('✅');
  } catch (error) {
    return;
  }
}

function deleteCharacter(client, message) {
  try {
    const characterListJson = JSON.parse(fs.readFileSync(`./character_list.json`));
    const newCharacterListJson = Object.entries(characterListJson).filter(x => x[0] != message.author.id);
    const objectNewCharacterListJson = Object.fromEntries(newCharacterListJson)
    fs.writeFileSync(`./character_list.json`, JSON.stringify(objectNewCharacterListJson, null, 2));
  } catch (error) {
    return;
  }
}

module.exports = { chat, chatCharacter, createCharacter, deleteCharacter };