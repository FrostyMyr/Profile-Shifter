const fs = require("fs");

function autoProfileShiftInteraction(client, ChannelType, PermissionsBitField) {
  client.guilds.cache.forEach(async (guild) => {
    let autoProfileShiftChannel = await guild.channels.cache.find(channel => channel.name === 'auto-profile-shift');

    if (!autoProfileShiftChannel) {
      await guild.channels.create({ 
        name: 'auto-profile-shift',
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [
              PermissionsBitField.Flags.ViewChannel,
            ],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
            ],
          },
        ],
      }).then(newChannel => autoProfileShiftChannel = newChannel);
    }

    const fakeInteraction = {
      user: client.user,
      guild: guild,
      channel: autoProfileShiftChannel,
      createdTimestamp: Date.now(),
    };
    
    try {
      await client.commands.get('profile_shift').execute(fakeInteraction, client);
    } catch (error) {
      console.error(error);
    }
  });
}

function autoProfileShift(client, ChannelType, PermissionsBitField) {
  setInterval(() => {
    const currentTime = new Date();
    const currentFormattedTime = currentTime.toLocaleTimeString('en-US', { 
      hour12: false 
    });
    
    if (currentFormattedTime.startsWith('12:00:00') || currentFormattedTime.startsWith('00:00:00')) {
      console.log(currentFormattedTime);
      autoProfileShiftInteraction(client, ChannelType, PermissionsBitField); 
    }
  }, 1000);
}

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
      console.error(error);
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
      console.error(error);
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
    console.error(error);
    return;
  }
}

module.exports = { autoProfileShift, autoProfileShiftInteraction, chat, chatCharacter, createCharacter, deleteCharacter };