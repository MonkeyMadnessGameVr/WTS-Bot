import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from "discord.js";
import config from "../../config/application.js";

export default {
  data: new SlashCommandBuilder()
    .setName("request")
    .setDescription("Request a player to join your team.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Player you want to request")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const requestedUser = interaction.options.getUser("user", true);
    const teamRoleIds = config.bot.league?.teamRoleIds || [];
    const requestChannelId = config.bot.league?.requestChannelId;

    const memberTeamRole = interaction.member.roles.cache.find((role) =>
      teamRoleIds.includes(role.id),
    );

    if (!memberTeamRole) {
      return interaction.editReply({
        content: "You are not on a team.",
      });
    }

    const channel = await interaction.client.channels
      .fetch(requestChannelId)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) {
      return interaction.editReply({
        content: "I could not find the request channel.",
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`league_request_accept:${interaction.user.id}:${requestedUser.id}:${memberTeamRole.id}`)
        .setLabel("Yes")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`league_request_deny:${interaction.user.id}:${requestedUser.id}:${memberTeamRole.id}`)
        .setLabel("No")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger),
    );

    await channel.send({
      content: `${interaction.user} requested that ${requestedUser} to be on ${memberTeamRole}`,
      components: [row],
    });

    await interaction.editReply({
      content: `Request sent to <#${requestChannelId}>.`,
    });
  },
};