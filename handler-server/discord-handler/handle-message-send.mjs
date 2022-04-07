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

      const messageObj = {
        username: messageData.author.username,
        avatarURL: messageData.author.avatar_url,
        files,
        embeds: messageData.embeds,
      };
      if (messageData.content) {
        messageObj.content = messageData.content;
      }

      await mirrorWebhook.send(messageObj);
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
