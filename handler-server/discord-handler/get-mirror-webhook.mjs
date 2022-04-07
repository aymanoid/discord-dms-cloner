const getMirrorWebhook = async (
  guildChannels,
  channelData,
  archiveCategory
) => {
  let mirrorChannel = guildChannels.find(
    (e) =>
      e.topic &&
      e.topic.endsWith(`${channelData.id}_DMS`) &&
      e.parent === archiveCategory
  );

  if (!mirrorChannel) {
    let mirrorChannelName, mirrorChannelTopic;

    if (channelData.type === "private") {
      mirrorChannelName = channelData.recipient.name;
      mirrorChannelTopic = `${channelData.name}\n- ID: ${channelData.recipient.id}\n- ${channelData.id}_DMS`;
    }
    if (channelData.type === "group") {
      mirrorChannelName = channelData.name;
      mirrorChannelTopic = `${
        channelData.name
      }\n- IDs: ${channelData.recipients.join(", ")}\n- ${channelData.id}_DMS`;
    }

    if (mirrorChannelName.length > 100) {
      mirrorChannelName = mirrorChannelName.substring(0, 100);
    }
    if (mirrorChannelTopic > 1024) {
      mirrorChannelTopic = `${channelData.id}_DMS`;
    }

    mirrorChannel = await archiveCategory.createChannel(mirrorChannelName, {
      topic: mirrorChannelTopic,
    });
  }

  const channelWebhooks = await mirrorChannel.fetchWebhooks();
  let mirrorWebhook = channelWebhooks.find((e) =>
    e.name.endsWith(`${channelData.id}_WH`)
  );
  if (!mirrorWebhook) {
    mirrorWebhook = await mirrorChannel.createWebhook(`${channelData.id}_WH`);
  }

  return mirrorWebhook;
};

export default getMirrorWebhook;
