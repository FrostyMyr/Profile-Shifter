const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cancel_swap")
    .setDescription("Cancel your swap with someone."),
  async execute(interaction, client) {
    const user = interaction.user;

    const swapJson = JSON.parse(fs.readFileSync(`./swap.json`));
    const partnerSwapJson = Object.entries(swapJson).find(u => u[1].partnerId == user.id);
    delete swapJson[user.id];
    delete swapJson[partnerSwapJson[0]];
    await fs.writeFileSync(`./swap.json`, JSON.stringify(swapJson, null, 2));

    interaction.reply({
      content: `${user} has stopped swapping.`,
    });
  },
}