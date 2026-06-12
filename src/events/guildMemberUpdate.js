import { Events } from "discord.js";
import { logger } from "../utils/logger.js";
import config from "../config/application.js";

export default {
  name: Events.GuildMemberUpdate,
  once: false,

  async execute(oldMember, newMember) {
    try {
      logger.info(`guildMemberUpdate fired for ${newMember.user.tag}`);

      const transactionChannelId = config.bot.league?.transactionChannelId;
      const teamRoleIds = config.bot.league?.teamRoleIds || [];

      const oldRoleIds = new Set(oldMember.roles.cache.map((role) => role.id));
      const addedRoles = newMember.roles.cache.filter((role) => !oldRoleIds.has(role.id));

      logger.info(`Added roles: ${addedRoles.map((role) => `${role.name}:${role.id}`).join(", ") || "none"}`);

      const addedTeamRoles = addedRoles.filter((role) => teamRoleIds.includes(role.id));

      if (addedTeamRoles.size === 0) return;

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
    } catch (error) {
      logger.error("Error in guildMemberUpdate event:", error);
    }
  },
};
