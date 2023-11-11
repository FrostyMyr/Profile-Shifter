const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile_shift")
    .setDescription("Swap your profile."),
  async execute(interaction, client) {
    const user = interaction.user;

    // Read the JSON file
    const profileShiftJson = JSON.parse(fs.readFileSync('./profile_shift.json'));

    // Check if user ID exists
    if (!profileShiftJson.hasOwnProperty(user.id)) {
      // Add user if not exists
      profileShiftJson[user.id] = { 
        "id": user.id 
      };
    }

    // Shuffle the user IDs
    const shuffledUserIds = derange(Object.keys(profileShiftJson));

    // Update the JSON object
    Object.keys(profileShiftJson).forEach((originalId, index) => {
      const shuffledId = shuffledUserIds[index];
      profileShiftJson[originalId] = { 
        "id": shuffledId 
      };
    });

    // Write the updated JSON back to the file
    fs.writeFileSync('./profile_shift.json', JSON.stringify(profileShiftJson, null, 2));

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