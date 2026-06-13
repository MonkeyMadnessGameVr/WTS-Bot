import { Events } from "discord.js";
import { logger } from "../utils/logger.js";
import config from "../config/application.js";

export default {
  name: Events.GuildMemberUpdate,
  once: false,

  async execute(oldMember, newMember) {
    try {
      const transactionChannelId = config.bot.league?.transactionChannelId;
      const teamRoleIds = config.bot.league?.teamRoleIds || [];

      if (!transactionChannelId || teamRoleIds.length === 0) return;

      const oldRoleIds = new Set(oldMember.roles.cache.map((role) => role.id));
      const newRoleIds = new Set(newMember.roles.cache.map((role) => role.id));

      const addedTeamRoles = newMember.roles.cache.filter(
        (role) => !oldRoleIds.has(role.id) && teamRoleIds.includes(role.id),
      );

      const removedTeamRoles = oldMember.roles.cache.filter(
        (role) => !newRoleIds.has(role.id) && teamRoleIds.includes(role.id),
      );

      if (addedTeamRoles.size === 0 && removedTeamRoles.size === 0) return;

      const channel = await newMember.client.channels
        .fetch(transactionChannelId)
        .catch((error) => {
          logger.error("Could not fetch transaction channel:", error);
          return null;
        });

      if (!channel || !channel.isTextBased()) {
        logger.warn(`Transaction channel not found or not text based: ${transactionChannelId}`);
        return;
      }

      for (const role of addedTeamRoles.values()) {
        await channel.send({
          content: `${newMember} Joined ${role}`,
        });
      }

      for (const role of removedTeamRoles.values()) {
        await channel.send({
          content: `${newMember} has left ${role}`,
        });
      }
    } catch (error) {
      logger.error("Error in guildMemberUpdate event:", error);
    }
  },
};
