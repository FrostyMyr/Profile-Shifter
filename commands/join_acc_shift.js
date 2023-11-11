const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join_acc_shift")
    .setDescription("Join a great shift session.")
    .addStringOption((option) => 
      option
        .setName("email")
        .setDescription("email.")
        .setRequired(true)
    )
    .addStringOption((option) => 
      option.setName("pass")
        .setDescription("pass.")
        .setRequired(true)
    )
    .addStringOption((option) => 
      option.setName("2fa")
        .setDescription("2fa")
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const email = interaction.options.getString("email");
    const pass = interaction.options.getString("pass");
    const auth = interaction.options.getString("2fa") ?? '';
    const user = interaction.user;

    const accShiftJson = JSON.parse(fs.readFileSync(`./acc_shift.json`));
    const newAccShiftJson = Object.assign({}, accShiftJson, {
      [user.id]: {
        "email": email,
        "pass": pass,
        "auth": auth
      }
    });
    await fs.writeFileSync(`./acc_shift.json`, JSON.stringify(newAccShiftJson, null, 2));

    interaction.reply({
      content: 'You joined great shift session.',
      ephemeral: true
    });
    interaction.channel.send(`Someone joined great shift session. \n${Object.keys(newAccShiftJson).length} people ready to swap.`);
  }
}