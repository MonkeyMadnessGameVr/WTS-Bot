import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { createEmbed } from "../../utils/embeds.js";
import { logger } from "../../utils/logger.js";
import { handleInteractionError } from "../../utils/errorHandler.js";
import { InteractionHelper } from "../../utils/interactionHelper.js";
import { botConfig } from "../../config/bot.js";

export default {
  data: new SlashCommandBuilder()
    .setName("team")
    .setDescription("Create a GTAG League team role and give it to players.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((option) =>
      option.setName("name").setDescription("Team name").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("members").setDescription("Mention players like @user @user").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("color").setDescription("Hex color like #ff0000").setRequired(true),
    ),

  async execute(interaction) {
    try {
      const name = interaction.options.getString("name", true).trim();
      const membersText = interaction.options.getString("members", true);
      const colorInput = interaction.options.getString("color", true).trim();
      const colorMatch = colorInput.match(/^#?([0-9a-fA-F]{6})$/);

      if (!colorMatch) {
        return InteractionHelper.safeReply(interaction, {
          content: "Please use a valid hex color, like `#ff0000`.",
          ephemeral: true,
        });
      }

      const color = `#${colorMatch[1]}`;
      const memberIds = [...new Set([...membersText.matchAll(/<@!?(\d+)>/g)].map((m) => m[1]))];

      if (memberIds.length === 0) {
        return InteractionHelper.safeReply(interaction, {
          content: "Please mention at least one player.",
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const role = await interaction.guild.roles.create({
        name,
        color,
        mentionable: botConfig.league?.teamRoleMentionable ?? true,
        reason: `GTAG League team created by ${interaction.user.tag}`,
      });

      const added = [];

      for (const id of memberIds) {
        const member = await interaction.guild.members.fetch(id).catch(() => null);
        if (!member) continue;

        await member.roles.add(role, `Added to GTAG League team ${name}`);
        added.push(`${member}`);
      }

      const embed = createEmbed({
        title: "Team Created",
        description: `Created ${role} and added ${added.length} player(s).`,
        color,
      }).addFields({
        name: "Members",
        value: added.join(", ") || "None",
      });

      await interaction.editReply({ embeds: [embed] });

      logger.info("GTAG team created", {
        teamName: name,
        roleId: role.id,
        createdBy: interaction.user.id,
      });
    } catch (error) {
      await handleInteractionError(interaction, error, {
        commandName: "team",
        source: "team_command",
      });
    }
  },
};