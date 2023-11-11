const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset_shift")
    .setDescription("Reset profile shift."),
  async execute(interaction, client) {
    fs.writeFileSync(`./profile_shift.json`, '{}');

    interaction.reply({
      content: `Profile shift is resetted.`,
      ephemeral: false
    });
  }
}