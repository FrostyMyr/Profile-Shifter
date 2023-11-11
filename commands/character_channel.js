const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chracter_channel")
    .setDescription("Setting a character channel.")
    .addStringOption((option) =>
			option.setName('type')
        .setDescription('Setting Type.')
				.setRequired(true)
				.addChoices(
					{ name: 'Set', value: 'set' },
					{ name: 'Delete', value: 'delete' },
				)
    ),
  async execute(interaction, client) {
    const settingType = interaction.options.getString('type');
    const thisChannel = interaction.channel.id;
    const characterChannelJson = JSON.parse(fs.readFileSync(`./character_channel.json`));
    
    interaction.channel.fetchWebhooks().then((webhook) => {
      if (!webhook.find(wh => wh.owner.id == client.user.id)) interaction.channel.createWebhook({ name: "Profile Shifter" });
    });
    
    if (settingType == 'set' && !characterChannelJson.includes(thisChannel)) {
      const newCharacterChannelJson = [...characterChannelJson, thisChannel];
      fs.writeFileSync(`./character_channel.json`, JSON.stringify(newCharacterChannelJson, null, 2));
      
      interaction.reply({
        content: `This channel has become character channel`,
        ephemeral: false
      });

      return;
    } else if (settingType == 'delete') {
      const newCharacterChannelJson = characterChannelJson.filter(x => x != thisChannel);
      fs.writeFileSync(`./character_channel.json`, JSON.stringify(newCharacterChannelJson, null, 2));
      
      interaction.reply({
        content: `This channel is not character channel anymore`,
        ephemeral: false
      }); 
    } else {
      interaction.reply({
        content: `This channel is already character channel`,
        ephemeral: true
      });
    }
  }
}