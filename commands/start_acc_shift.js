const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start_acc_shift")
    .setDescription("Start a great shift."),
  async execute(interaction, client) {
    const user = interaction.user;
    const accShiftJson = Object.entries(JSON.parse(fs.readFileSync(`./acc_shift.json`)));
    const shuffledAccShiftJson = derange(accShiftJson);
    
    if (accShiftJson.length == 0) {
      interaction.reply({
        content: `Nobody is in the great shift.`,
      });
      return;
    }

    await accShiftJson.forEach(async (rawData, index) => {
      const data = rawData;
      const newData = shuffledAccShiftJson[index];
      
      await client.users.send(data[0], `Here is your new body.`);
      await client.users.send(data[0], `${newData[1]['email']} \n${newData[1]['pass']} \n${newData[1]['auth']}`);
    }); 

    await fs.writeFileSync(`./acc_shift.json`, '{}');
    interaction.reply({
      content: `${user} started the great shift.`
    });

    function derangementNumber(n) {
      if (n == 0) return 1;

      var factorial = 1;

      while (n) {
        factorial *= n--;
      }

      return Math.floor(factorial / Math.E);
    }

    function derange(array) {
      array = array.slice();
      var mark = array.map(function() { return false; });

      for (var i = array.length - 1, u = array.length - 1; u > 0; i--) {
        if (!mark[i]) {
          var unmarked = mark.map(function(_, i) {
            return i;
          }).filter(function(j) {
            return !mark[j] && j < i;
          });
          var j = unmarked[Math.floor(Math.random() * unmarked.length)];

          var tmp = array[j];
          array[j] = array[i];
          array[i] = tmp;

          // this introduces the unbiased random characteristic
          if (Math.random() < u * derangementNumber(u - 1) / derangementNumber(u + 1)) {
            mark[j] = true;
            u--;
          }
          u--;
        }
      }

      return array;
    }
  }
}