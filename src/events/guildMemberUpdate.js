import { Events } from "discord.js";
import { logEvent, EVENT_TYPES } from "../services/loggingService.js";
import { logger } from "../utils/logger.js";
import config from "../config/application.js";

export default {
  name: Events.GuildMemberUpdate,
  once: false,

  async execute(oldMember, newMember) {
    try {
      if (!newMember.guild) return;

      const transactionChannelId = config.bot.league?.transactionChannelId;
      const teamRoleIds = config.bot.league?.teamRoleIds || [];

      const addedTeamRoles = newMember.roles.cache.filter(
        (role) => !oldMember.roles.cache.has(role.id) && teamRoleIds.includes(role.id),
      );

      if (addedTeamRoles.size > 0 && transactionChannelId) {
        const channel = await newMember.client.channels
          .fetch(transactionChannelId)
          .catch(() => null);

        if (channel && channel.isTextBased()) {
          for (const role of addedTeamRoles.values()) {
            await channel.send({
              content: `${newMember} Joined ${role}`,
            });
          }
        }
      }

      const fields = [];
      fields.push({
        name: "Member",
        value: `${newMember.user.tag} (${newMember.user.id})`,
        inline: true,
      });

      if (oldMember.nickname !== newMember.nickname) {
        fields.push({
          name: "Old Nickname",
          value: oldMember.nickname || "*(no nickname)*",
          inline: true,
        });

        fields.push({
          name: "New Nickname",
          value: newMember.nickname || "*(no nickname)*",
          inline: true,
        });

        await logEvent({
          client: newMember.client,
          guildId: newMember.guild.id,
          eventType: EVENT_TYPES.MEMBER_NAME_CHANGE,
          data: {
            description: `Member nickname changed: ${newMember.user.tag}`,
            userId: newMember.user.id,
            fields,
          },
        });
      }
    } catch (error) {
      logger.error("Error in guildMemberUpdate event:", error);
    }
  },
};
