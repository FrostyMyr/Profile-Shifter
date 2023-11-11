const fs = require("fs");

function chat(client, message) {
  fs.readFile('./swap.json', async (err, data) => {
    const swapJson = JSON.parse(data.toString());
    const userSwapJson = Object.entries(swapJson).find(u => u[0] == message.author.id);

    if (userSwapJson == undefined) return;

    message.delete();
    const webhook = await message.channel.fetchWebhooks().then(webhook => webhook.find(wh => wh.owner.id == client.user.id));

    webhook.send({
      username: userSwapJson[1].name,
      avatarURL: userSwapJson[1].avatar,
      content: message.content,
      files: message.attachments.map(file => file.attachment)
    });
  });
}

module.exports = { chat };