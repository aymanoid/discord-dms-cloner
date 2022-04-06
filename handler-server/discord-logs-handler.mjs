import { MessageEmbed } from "discord.js";
import formatDuration from "format-duration";

const getUserString = (user) => {
  return `${user.username}#${user.discriminator}@${user.id}`;
};

const discordLogsChannel = async (guildChannels, archiveCategory, bodyData) => {
  let logsChannel = guildChannels.find(
    (e) =>
      e.topic &&
      e.topic.endsWith(`${bodyData.channel_data.id}_DMS_LOGS`) &&
      e.parent === archiveCategory
  );

  if (!logsChannel) {
    let logsChannelName, logsChannelTopic;

    if (bodyData.channel_data.type === "private") {
      logsChannelName = `${bodyData.channel_data.recipient.name}-logs`;
      logsChannelTopic = `${bodyData.channel_data.name}\n- ID: ${bodyData.channel_data.recipient.id}\n- ${bodyData.channel_data.id}_DMS_LOGS`;
    }
    if (bodyData.channel_data.type === "group") {
      logsChannelName = `${bodyData.channel_data.name}-logs`;
      logsChannelTopic = `${
        bodyData.channel_data.name
      }\n- IDs: ${bodyData.channel_data.recipients.join(", ")}\n- ${
        bodyData.channel_data.id
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
      logsChannelTopic = `${bodyData.channel_data.id}_DMS_LOGS`;
    }

    logsChannel = await archiveCategory.createChannel(logsChannelName, {
      topic: logsChannelTopic,
    });
  }

  const channelWebhooks = await logsChannel.fetchWebhooks();
  let archiveWebhook = channelWebhooks.find((e) =>
    e.name.endsWith(`${bodyData.channel_data.id}_WH`)
  );
  if (!archiveWebhook) {
    archiveWebhook = await logsChannel.createWebhook(
      `${bodyData.channel_data.id}_WH`
    );
  }

  switch (bodyData.message_data.type) {
    case 1: {
      const messageObj = {
        username: "System",
        embeds: [
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
        ],
      };

      await archiveWebhook.send(messageObj);
      break;
    }
    case 2: {
      const messageObj = {
        username: "System",
        embeds: [
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
        ],
      };

      await archiveWebhook.send(messageObj);
      break;
    }
    case 3: {
      const messageObj = { username: "System" };

      if (bodyData.kind === "send") {
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

      await archiveWebhook.send(messageObj);
      break;
    }
    default: {
      break;
    }
  }

  return bodyData;
};

export default discordLogsChannel;
