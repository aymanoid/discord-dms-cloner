import getMirrorWebhook from "./get-mirror-webhook.mjs";
import getLogsWebhook from "./get-logs-webhook.mjs";
import handleMessageSend from "./handle-message-send.mjs";
import handleMessageEdit from "./handle-message-edit.mjs";

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

  const [mirrorWebhook, logsWebhook] = await Promise.all([
    getMirrorWebhook(guildChannels, bodyData.channel_data, archiveCategory),
    getLogsWebhook(guildChannels, bodyData.channel_data, archiveCategory),
  ]);

  switch (bodyData.kind) {
    case "MESSAGE_SEND":
      await handleMessageSend(
        bodyData.message_data,
        client,
        mirrorWebhook,
        logsWebhook
      );
      break;
    case "MESSAGE_EDIT":
      await handleMessageEdit(bodyData.message_data, logsWebhook);
      break;
    default:
      break;
  }

  return bodyData;
};

export default discordHandler;
