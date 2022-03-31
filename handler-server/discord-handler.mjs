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

  let archiveChannel = guildChannels.find(
    (e) =>
      e.topic &&
      e.topic.endsWith(`${bodyData.channel_data.id}_DMS`) &&
      e.parent === archiveCategory
  );
  if (!archiveChannel) {
    let archiveChannelName, archiveChannelTopic;

    if (bodyData.channel_data.type === "private") {
      archiveChannelName = bodyData.channel_data.recipient.name;
      archiveChannelTopic = `${bodyData.channel_data.name}\n- ID: ${bodyData.channel_data.recipient.id}\n- ${bodyData.channel_data.id}_DMS`;
    }
    if (bodyData.channel_data.type === "group") {
      archiveChannelName = bodyData.channel_data.name;
      archiveChannelTopic = `${
        bodyData.channel_data.name
      }\n- IDs: ${bodyData.channel_data.recipients
        .map((e) => e.id)
        .join(" , ")}\n- ${bodyData.channel_data.id}_DMS`;
    }

    if (archiveChannelName.length > 100) {
      archiveChannelName = archiveChannelName.substring(0, 100);
    }
    if (archiveChannelTopic > 1024) {
      archiveChannelTopic = `${bodyData.channel_data.id}_DMS`;
    }

    archiveChannel = await archiveCategory.createChannel(archiveChannelName, {
      topic: archiveChannelTopic,
    });
  }

  const channelWebhooks = await archiveChannel.fetchWebhooks();
  let archiveWebhook = channelWebhooks.find((e) =>
    e.name.endsWith(`${bodyData.channel_data.id}_WH`)
  );
  if (!archiveWebhook) {
    archiveWebhook = await archiveChannel.createWebhook(
      `${bodyData.channel_data.id}_WH`
    );
  }

  const files = bodyData.message_data.attachments.map((e) => ({
    attachment: e.url,
    name: e.filename,
  }));
  if (bodyData.message_data.sticker_items) {
    const stickers = await Promise.all(
      bodyData.message_data.sticker_items.map((e) => client.fetchSticker(e.id))
    );
    stickers.forEach((e) =>
      files.push({
        attachment: e.url,
        name: `${e.name}-${e.url.substring(e.url.lastIndexOf("/") + 1)}`,
      })
    );
  }

  const messageObj = {
    files,
    embeds: bodyData.message_data.embeds,
    username: bodyData.message_data.author.username,
    avatarURL: bodyData.message_data.author.avatar_url,
  };
  if (bodyData.message_data.content) {
    messageObj.content = bodyData.message_data.content;
  }
  await archiveWebhook.send(messageObj);
  return bodyData;
};

export default discordHandler;
