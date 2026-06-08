import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { createEmbed } from "../../utils/embeds.js";
import { handleInteractionError } from "../../utils/errorHandler.js";
import { botConfig } from "../../config/bot.js";

export default {
    data: new SlashCommandBuilder()
        .setName("transaction")
        .setDescription("Record a GTAG League team transaction.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption((option) =>
            option.setName("user").setDescription("Player").setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("Transaction type")
                .setRequired(true)
                .addChoices(
                    { name: "Left", value: "left" },
                    { name: "Joined", value: "joined" },
                    { name: "Created", value: "created" },
                    { name: "Disbanded", value: "disbanded" },
                ),
        )
        .addRoleOption((option) =>
            option.setName("team").setDescription("Team role").setRequired(true),
        ),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser("user", true);
            const type = interaction.options.getString("type", true);
            const role = interaction.options.getRole("team", true);
            const label = botConfig.league?.transactionTypes?.[type] ?? type;

            await interaction.deferReply();

            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (member && (type === "joined" || type === "created")) {
                await member.roles.add(role, `${label} ${role.name}`);
            }

            if (member && type === "left") {
                await member.roles.remove(role, `${label} ${role.name}`);
            }

                  const channelId = botConfig.league?.transactionChannelId;
      const channel = await interaction.client.channels.fetch(channelId).catch(() => null);

      if (!channel || !channel.isTextBased()) {
        return interaction.editReply({
          content: "I could not find the transactions channel. Check the channel ID in `bot.js`.",
        });
      }

      const messages = {
        left: `${user} has left ${role}`,
        joined: `${user} has joined ${role}`,
        created: `${user} created team ${role}`,
        disbanded: `${user} disbanded team ${role}`,
      };

      await channel.send({
        content: messages[type] ?? `${user} ${label} ${role}`,
      });
        } catch (error) {
            await handleInteractionError(interaction, error, {
                commandName: "transaction",
                source: "transaction_command",
            });
        }
    },
};
