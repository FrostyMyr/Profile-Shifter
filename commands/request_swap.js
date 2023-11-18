const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("request_swap")
    .setDescription("Request swap with someone.")
    .addUserOption((option) => 
      option.setName("member")
        .setDescription("Body you wanna swap with.")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    let target, user;
    const guildId = interaction.guild.id;

    // Check interaction type
    if (interaction.isButton()) {
      const swapper = interaction.customId.split(`-${guildId}-`)[1].split('-');
      userOwner = swapper[0];
      targetOwner = swapper[1];
      this.startSwap(client, interaction, targetOwner, userOwner);
      return;
    } else {
      target = interaction.options.getUser("member");
      user = interaction.user;
    }

    // Get user and target data
    const profileShiftJson = JSON.parse(fs.readFileSync(`./${guildId}_profile_shift.json`));
    const userData = Object.entries(profileShiftJson).find(u => u[0] == user.id);
    const targetData = Object.entries(profileShiftJson).find(t => t[1]['id'] == target.id);
    const userBody = await client.users.fetch(userData[1]['id']);
    const targetBody = await client.users.fetch(targetData[1]['id']);

    if (userData[0] == targetData[0]) {
      interaction.reply({
        content: `Can't swap with yourself 🫤`,
        ephemeral: true
      });
      return;
    }

    // Create temp swap json
    const newSwapJson = {
      [userData[0]]: {
        "id": userData[1]['id']
      },
      [targetData[0]]: {
        "id": targetData[1]['id']
      },
    };
    await fs.writeFileSync(`./temp-swap-${guildId}-${userData[0]}.json`, JSON.stringify(newSwapJson, null, 2));

    // Create confirm button field
    const confirmButton = new ActionRowBuilder();
    confirmButton.addComponents(
        new ButtonBuilder()
          .setCustomId(`${interaction.commandName}[-]y-${guildId}-${userData[0]}-${targetData[0]}`)
          .setLabel("Yes")
          .setStyle(ButtonStyle.Primary)
      );
    confirmButton.addComponents(
        new ButtonBuilder()
          .setCustomId(`${interaction.commandName}[-]n-${guildId}-${userData[0]}-${targetData[0]}`)
          .setLabel("No")
          .setStyle(ButtonStyle.Danger)
      );

    // Send reply to command
    interaction.reply({
      components: [confirmButton],
      content: `**${userBody.globalName}** want to swap with **${targetBody.globalName}**`,
    });

    // Tag user and target owner then delete afterward
    interaction.channel.send(`<@${userData[0]}><@${targetData[0]}>`).then((sentMessage) => sentMessage.delete())
  },
  async startSwap(client, interaction, targetOwner, userOwner) {
    if (!interaction.customId.endsWith(interaction.user.id)) {
      interaction.reply({
        content: "This button isn't for you.",
        ephemeral: true
      });
      return;
    }

    interaction.message.delete();
    const guildId = interaction.guild.id;

    if (interaction.customId.split("[-]")[1].startsWith('n-')) {
      fs.unlinkSync(`./temp-swap-${guildId}-${userOwner}.json`);
      return;
    }
    
    const profileShiftJson = JSON.parse(fs.readFileSync(`./${guildId}_profile_shift.json`));
    const tempSwapJson = JSON.parse(fs.readFileSync(`./temp-swap-${guildId}-${userOwner}.json`));
    const userData = Object.entries(profileShiftJson).find(u => u[0] == userOwner);
    const targetData = Object.entries(profileShiftJson).find(t => t[0] == targetOwner);

    newSwapJson = Object.assign({}, profileShiftJson, {
      [userData[0]]: {
        "id": targetData[1]['id'],
      },
      [targetData[0]]: {
        "id": userData[1]['id'],
      },
    });

    await fs.writeFileSync(`./${interaction.guild.id}_profile_shift.json`, JSON.stringify(newSwapJson, null, 2));
    await fs.unlinkSync(`./temp-swap-${guildId}-${userOwner}.json`);
  }
}