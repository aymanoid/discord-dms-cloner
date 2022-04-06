import discordCloneHandler from "./discord-clone-handler.mjs";
import discordLogsChannel from "./discord-logs-handler.mjs";

const discordHandler = async (config, client, bodyData) => {
  const archiveGuild = await client.guilds.fetch(config.discord.archive_guild);
  const guildChannels = await archiveGuild.channels.fetch();

  let archiveCategory = guildChannels.find((e) =>
    e.name.endsWith(`${bodyData.target_data.id}_DMS`)
  );
  if (!archiveCategory) {
    archiveCategory = await archiveGuild.channels.create(
      `${bodyData.target_data.tag} DMs - ${bodyData.target_data.id}_DMS`,
      { type: "GUILD_CATEGORY" }
    );
  }

  await Promise.all([
    discordCloneHandler(guildChannels, archiveCategory, bodyData, client),
    discordLogsChannel(guildChannels, archiveCategory, bodyData),
  ]);

  return bodyData;
};

export default discordHandler;
