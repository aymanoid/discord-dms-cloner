import { MessageEmbed } from "discord.js";
import formatDuration from "format-duration";

const getUserString = (user) => {
  return `${user.username}#${user.discriminator}@${user.id}`;
};

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
      }\n- IDs: ${bodyData.channel_data.recipients.join(", ")}\n- ${
        bodyData.channel_data.id
      }_DMS`;
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

  const messageObj = {};

  switch (bodyData.message_data.type) {
    case 0:
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

      messageObj.username = bodyData.message_data.author.username;
      messageObj.avatarURL = bodyData.message_data.author.avatar_url;
      messageObj.files = files;
      messageObj.embeds = bodyData.message_data.embeds;
      if (bodyData.message_data.content) {
        messageObj.content = bodyData.message_data.content;
      }
      break;
    case 1:
      messageObj.username = "System";
      messageObj.embeds = [
        new MessageEmbed({
          title: "Group Member Added",
          timestamp: bodyData.message_data.timestamp,
          fields: [
            {
              name: "Executor",
              value: getUserString(bodyData.message_data.author),
              inline: true,
            },
            {
              name: "User Added",
              value: getUserString(bodyData.message_data.mentions[0]),
              inline: true,
            },
          ],
          footer: { text: `Message ID: ${bodyData.message_data.id}` },
        }),
      ];
      break;
    case 2:
      messageObj.username = "System";
      messageObj.embeds = [
        new MessageEmbed({
          title: "Group Member Left",
          timestamp: bodyData.message_data.timestamp,
          fields: [
            {
              name: "User Left",
              value: getUserString(bodyData.message_data.author),
              inline: true,
            },
          ],
          footer: { text: `Message ID: ${bodyData.message_data.id}` },
        }),
      ];
      break;
    case 3:
      if (bodyData.kind === "send") {
        messageObj.username = "System";
        messageObj.embeds = [
          new MessageEmbed({
            title: "Call Started",
            timestamp: bodyData.message_data.timestamp,
            fields: [
              {
                name: "Starter",
                value: getUserString(bodyData.message_data.author),
                inline: true,
              },
              {
                name: "Participants",
                value: bodyData.message_data.call.participants.join("\n"),
                inline: false,
              },
            ],
            footer: { text: `Message ID: ${bodyData.message_data.id}` },
          }),
        ];
      }
      if (bodyData.kind === "edit") {
        const endedTimestamp = bodyData.message_data.call.ended_timestamp;

        if (endedTimestamp) {
          const endedDate = new Date(endedTimestamp).toLocaleString("en-GB");
          const callDuration = formatDuration(
            Math.abs(
              new Date(bodyData.message_data.timestamp) -
                new Date(endedTimestamp)
            )
          );

          messageObj.username = "System";
          messageObj.embeds = [
            new MessageEmbed({
              title: "Call Ended",
              timestamp: bodyData.message_data.timestamp,
              fields: [
                {
                  name: "Starter",
                  value: getUserString(bodyData.message_data.author),
                  inline: true,
                },
                {
                  name: "Ended At",
                  value: endedDate,
                  inline: true,
                },
                {
                  name: "Lasted For",
                  value: callDuration,
                  inline: true,
                },
                {
                  name: "Participants",
                  value: bodyData.message_data.call.participants.join("\n"),
                  inline: false,
                },
              ],
              footer: { text: `Message ID: ${bodyData.message_data.id}` },
            }),
          ];
        } else {
          messageObj.username = "System";
          messageObj.embeds = [
            new MessageEmbed({
              title: "Call Updated",
              timestamp: bodyData.message_data.timestamp,
              fields: [
                {
                  name: "Starter",
                  value: getUserString(bodyData.message_data.author),
                  inline: true,
                },
                {
                  name: "Participants",
                  value: bodyData.message_data.call.participants.join("\n"),
                  inline: false,
                },
              ],
              footer: { text: `Message ID: ${bodyData.message_data.id}` },
            }),
          ];
        }
      }
      break;
    default:
      messageObj.content = `\`[${bodyData.message_data.type}] message type is not supported\``;
  }

  await archiveWebhook.send(messageObj);
  return bodyData;
};

export default discordHandler;
