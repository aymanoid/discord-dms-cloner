const getLogsWebhook = async (guildChannels, channelData, archiveCategory) => {
  let logsChannel = guildChannels.find(
    (e) =>
      e.topic &&
      e.topic.endsWith(`${channelData.id}_DMS_LOGS`) &&
      e.parent === archiveCategory
  );

  if (!logsChannel) {
    let logsChannelName, logsChannelTopic;

    if (channelData.type === "private") {
      logsChannelName = `${channelData.recipient.name}-logs`;
      logsChannelTopic = `${channelData.name}\n- ID: ${channelData.recipient.id}\n- ${channelData.id}_DMS_LOGS`;
    }
    if (channelData.type === "group") {
      logsChannelName = `${channelData.name}-logs`;
      logsChannelTopic = `${
        channelData.name
      }\n- IDs: ${channelData.recipients.join(", ")}\n- ${
        channelData.id
      }_DMS_LOGS`;
    }

    if (logsChannelName.length > 100) {
      const trimmedName = logsChannelName
        .split("-")
        .slice(0, -1)
        .join("-")
        .substring(0, 95);
      logsChannelName = `${trimmedName}-logs`;
    }
    if (logsChannelTopic > 1024) {
      logsChannelTopic = `${channelData.id}_DMS_LOGS`;
    }

    logsChannel = await archiveCategory.createChannel(logsChannelName, {
      topic: logsChannelTopic,
    });
  }

  const channelWebhooks = await logsChannel.fetchWebhooks();
  let logsWebhook = channelWebhooks.find((e) =>
    e.name.endsWith(`${channelData.id}_WH`)
  );
  if (!logsWebhook) {
    logsWebhook = await logsChannel.createWebhook(`${channelData.id}_WH`);
  }

  return logsWebhook;
};

export default getLogsWebhook;
