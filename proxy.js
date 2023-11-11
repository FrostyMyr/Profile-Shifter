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

module.exports = { chat };