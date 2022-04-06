const discordCloneHandler = async (
  guildChannels,
  archiveCategory,
  bodyData,
  client
) => {
  let cloneChannel = guildChannels.find(
    (e) =>
      e.topic &&
      e.topic.endsWith(`${bodyData.channel_data.id}_DMS`) &&
      e.parent === archiveCategory
  );

  if (!cloneChannel) {
    let cloneChannelName, cloneChannelTopic;

    if (bodyData.channel_data.type === "private") {
      cloneChannelName = bodyData.channel_data.recipient.name;
      cloneChannelTopic = `${bodyData.channel_data.name}\n- ID: ${bodyData.channel_data.recipient.id}\n- ${bodyData.channel_data.id}_DMS`;
    }
    if (bodyData.channel_data.type === "group") {
      cloneChannelName = bodyData.channel_data.name;
      cloneChannelTopic = `${
        bodyData.channel_data.name
      }\n- IDs: ${bodyData.channel_data.recipients.join(", ")}\n- ${
        bodyData.channel_data.id
      }_DMS`;
    }

    if (cloneChannelName.length > 100) {
      cloneChannelName = cloneChannelName.substring(0, 100);
    }
    if (cloneChannelTopic > 1024) {
      cloneChannelTopic = `${bodyData.channel_data.id}_DMS`;
    }

    cloneChannel = await archiveCategory.createChannel(cloneChannelName, {
      topic: cloneChannelTopic,
    });
  }

  const channelWebhooks = await cloneChannel.fetchWebhooks();
  let cloneWebhook = channelWebhooks.find((e) =>
    e.name.endsWith(`${bodyData.channel_data.id}_WH`)
  );
  if (!cloneWebhook) {
    cloneWebhook = await cloneChannel.createWebhook(
      `${bodyData.channel_data.id}_WH`
    );
  }

  if (bodyData.message_data.type === 0) {
    const files = bodyData.message_data.attachments.map((e) => ({
      attachment: e.url,
      name: e.filename,
    }));
    if (bodyData.message_data.sticker_items) {
      const stickers = await Promise.all(
        bodyData.message_data.sticker_items.map((e) =>
          client.fetchSticker(e.id)
        )
      );
      stickers.forEach((e) =>
        files.push({
          attachment: e.url,
          name: `${e.name}-${e.url.substring(e.url.lastIndexOf("/") + 1)}`,
        })
      );
    }

    const messageObj = {
      username: bodyData.message_data.author.username,
      avatarURL: bodyData.message_data.author.avatar_url,
      files,
      embeds: bodyData.message_data.embeds,
    };
    if (bodyData.message_data.content) {
      messageObj.content = bodyData.message_data.content;
    }

    await cloneWebhook.send(messageObj);
  }
  return bodyData;
};

export default discordCloneHandler;
