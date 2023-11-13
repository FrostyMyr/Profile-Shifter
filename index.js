const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { exec } = require('child_process');
const fs = require("fs");
const config = require("./config.json");
const proxy = require('./proxy.js');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
  ] 
});
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
const commands = [];

client.commands = new Collection();

// Get all commands
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
}

// On ready script
client.once("ready", async () => {
  console.log("The bot is online!");

  const clientId = client.user.id;
  const rest = new REST({
    version: "9"
  }).setToken(config["DISCORD_TOKEN"]);

  try {
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands
    });
    // await fs.writeFileSync(`./profile_shift.json`, '{}');
    // await fs.writeFileSync(`./character_list.json`, '{}');
    // await fs.writeFileSync(`./character_channel.json`, '[]');
    console.log("Successfully registered commands globally!");
  } catch (err) {
    console.error(err);
  }
});

// Slash interaction
client.on("interactionCreate", async (interaction) => {
  if (!(interaction.isCommand() || interaction.isButton())) return;

  let command;

  if (interaction.isCommand()) {
    command = client.commands.get(interaction.commandName);
  } else if (interaction.isButton()) {
    command = client.commands.get(interaction.customId.split("[-]")[0]);
  }

  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    if (err) console.error(err);
    await interaction.reply({
      content: "There is something wrong with your input.",
      ephemeral: true
    });
  }
});


// Proxy chat if userId is in swap.json
client.on("messageCreate", async (message) => {
  if (message.author.bot || message.webhookId) return;

  if (message.content.toLowerCase().startsWith('+character')) {
    message.content = message.content.split('+character ')[1];
    proxy.createCharacter(client, message);
    return;
  }
  
  if (message.content.toLowerCase().startsWith('-character')) {
    proxy.deleteCharacter(client, message);
    return;
  }

  let messageChannel = message.channel;
  let messageThreadId = null;
  if (message.channel.type == 11 || message.channel.type == 12) {
    messageChannel = await client.channels.fetch(message.channel.parentId);
    messageThreadId = message.channel.id;
  }
  let webhook = await messageChannel.fetchWebhooks().then(webhook => webhook.find(wh => wh.owner.id == client.user.id));
  if (!webhook) messageChannel.createWebhook({ name: "Profile Shifter" });

  let characterChannelJson;
  try {
    characterChannelJson = JSON.parse(fs.readFileSync(`./${message.guild.id}_character_channel.json`));
  } catch (error) {
    fs.writeFileSync(`./${message.guild.id}_character_channel.json`, '[]');
    characterChannelJson = JSON.parse(fs.readFileSync(`./${message.guild.id}_character_channel.json`));
  }
  
  if (characterChannelJson.includes(message.channel.id) || message.channel.type == 11 || message.channel.type == 12) {
    proxy.chatCharacter(client, message, messageChannel, messageThreadId);
  } else {
    proxy.chat(client, message, messageChannel, messageThreadId);
  }
});

// ACtivate bot
(async () => {
  try {
    client.login(config['DISCORD_TOKEN']);
  } catch (err) {
    exec("kill 1");
  }
})();

// Test new laptop