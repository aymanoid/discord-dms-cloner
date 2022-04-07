import { MessageEmbed } from "discord.js";
import { getUserString } from "./utils.mjs";

const handleMessageSend = async (
  messageData,
  client,
  mirrorWebhook,
  logsWebhook
) => {
  switch (messageData.type) {
    case 0: {
      const files = messageData.attachments.map((e) => ({
        attachment: e.url,
        name: e.filename,
      }));
      if (messageData.sticker_items) {
        const stickers = await Promise.all(
          messageData.sticker_items.map((e) => client.fetchSticker(e.id))
        );
        stickers.forEach((e) =>
          files.push({
            attachment: e.url,
            name: `${e.name}-${e.url.substring(e.url.lastIndexOf("/") + 1)}`,
          })
        );
      }

      const mirrorMsgObj = {
        username: messageData.author.username,
        avatarURL: messageData.author.avatar_url,
        files,
        embeds: messageData.embeds,
      };

      const logsMsgObj = {
        username: "System",
        files,
        embeds: [
          new MessageEmbed({
            author: {
              name: getUserString(messageData.author),
              iconURL: messageData.author.avatar_url,
            },
            timestamp: messageData.timestamp,
            footer: { text: `Message ID: ${messageData.id}` },
          }),
          ...messageData.embeds.slice(0, 9),
        ],
      };

      if (messageData.content) {
        mirrorMsgObj.content = messageData.content;
        logsMsgObj.embeds[0].description = messageData.content;
      }

      await Promise.all([
        mirrorWebhook.send(mirrorMsgObj),
        logsWebhook.send(logsMsgObj),
      ]);
      break;
    }
    case 3: {
      const messageObj = {
        username: "System",
        embeds: [
          new MessageEmbed({
            title: "Call Started",
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
        ],
      };

      await logsWebhook.send(messageObj);
    }
    default: {
      break;
    }
  }
};

export default handleMessageSend;
