const { Client, Collection, GatewayIntentBits, Partials, ChannelType, PermissionsBitField } = require("discord.js");
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
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
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

    await fs.readdirSync("./").filter(file => file.startsWith("temp-swap")).forEach(file => {
      fs.unlinkSync(file);
    });
    
    console.log("Successfully registered commands globally!");
    proxy.autoProfileShift(client, ChannelType, PermissionsBitField);
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

// Chat message command
client.on("messageCreate", async (message) => {
  if (message.author.bot || message.webhookId || message.content == '') return;

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

// Add reaction command
client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.emoji.name != '🗑️' && reaction.emoji.name != '🔍') return;
  
  const messageId = reaction.message.id;
  const channelId = reaction.message.channelId;
  const message = await client.channels.cache.get(channelId).messages.fetch(messageId);

  if (message.applicationId == client.user.id) {
    if (reaction.emoji.name == '🗑️') {
      await message.delete();
    } else if (reaction.emoji.name == '🔍') {
      reaction.users.remove(user.id);
      const avatarUrl = `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`;
      user.send({
        content: `${message.author.username}`,
        files: [{ 
          name: `${message.author.username}_avatar.png`, 
          attachment: avatarUrl
        }]
      });
    }
  }
});

// On new member command
client.on('guildMemberAdd', async (newMember) => {
  if (!newMember.user.avatar) {
    newMember.kick('Default/No avatar, you can join again if you already have an avatar').then(() => {
      console.log(`Kicked user ${newMember.user.tag} due to default/no avatar.`);
    })
  } else {
    proxy.autoProfileShiftInteraction(client, ChannelType, PermissionsBitField);
  }
});

// On member leave command
client.on('guildMemberRemove', (member) => {
  proxy.autoProfileShiftInteraction(client, ChannelType, PermissionsBitField);
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