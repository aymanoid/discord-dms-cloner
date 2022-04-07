import { MessageEmbed } from "discord.js";
import { getUserString } from "./utils.mjs";
import formatDuration from "format-duration";

const handleMessageEdit = async (messageData, logsWebhook) => {
  switch (messageData.type) {
    case 1: {
      const messageObj = {
        username: "System",
        embeds: [
          new MessageEmbed({
            title: "Group Member Added",
            timestamp: messageData.timestamp,
            fields: [
              {
                name: "Executor",
                value: getUserString(messageData.author),
                inline: true,
              },
              {
                name: "User Added",
                value: getUserString(messageData.mentions[0]),
                inline: true,
              },
            ],
            footer: { text: `Message ID: ${messageData.id}` },
          }),
        ],
      };

      await logsWebhook.send(messageObj);
      break;
    }
    case 2: {
      const messageObj = {
        username: "System",
        embeds: [
          new MessageEmbed({
            title: "Group Member Left",
            timestamp: messageData.timestamp,
            fields: [
              {
                name: "User Left",
                value: getUserString(messageData.author),
                inline: true,
              },
            ],
            footer: { text: `Message ID: ${messageData.id}` },
          }),
        ],
      };

      await logsWebhook.send(messageObj);
      break;
    }
    case 3: {
      const messageObj = { username: "System" };

      const endedTimestamp = messageData.call.ended_timestamp;

      if (endedTimestamp) {
        const endedDate = new Date(endedTimestamp).toLocaleString("en-GB");
        const callDuration = formatDuration(
          Math.abs(new Date(messageData.timestamp) - new Date(endedTimestamp))
        );

        messageObj.embeds = [
          new MessageEmbed({
            title: "Call Ended",
            timestamp: messageData.timestamp,
            fields: [
              {
                name: "Starter",
                value: getUserString(messageData.author),
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
                value: messageData.call.participants.join("\n"),
                inline: false,
              },
            ],
            footer: { text: `Message ID: ${messageData.id}` },
          }),
        ];
      } else {
        messageObj.embeds = [
          new MessageEmbed({
            title: "Call Updated",
            timestamp: messageData.timestamp,
            fields: [
              {
                name: "Starter",
                value: getUserString(messageData.author),
                inline: true,
              },
              {
                name: "Participants",
                value: messageData.call.participants.join("\n"),
                inline: false,
              },
            ],
            footer: { text: `Message ID: ${messageData.id}` },
          }),
        ];
      }

      await logsWebhook.send(messageObj);
      break;
    }
    default: {
      break;
    }
  }
};

export default handleMessageEdit;
