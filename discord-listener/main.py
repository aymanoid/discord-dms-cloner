import discord
import os
import json
import requests

f = open(os.path.join(os.path.dirname(__file__), "..", "config.json"))
config = json.load(f)


class MyClient(discord.Client):
    async def on_connect(self):
        print("Connected as", self.user)
        await client.change_presence(status=discord.Status.dnd, afk=True)

    async def on_message(self, message):
        if str(message.channel.type) not in ("private", "group"):
            return

        raw_message = await self.http.get_message(
            message_id=message.id, channel_id=message.channel.id
        )
        data_payload = {
            "target_data": {"id": str(self.user.id), "tag": str(self.user)},
            "channel_data": {
                "id": str(message.channel.id),
                "name": str(message.channel),
                "type": str(message.channel.type),
            },
            "message_data": raw_message,
        }
        if data_payload["channel_data"]["type"] == "private":
            data_payload["channel_data"]["recipient"] = {
                "id": message.channel.recipient.id,
                "name": message.channel.recipient.name,
            }
        if data_payload["channel_data"]["type"] == "group":
            data_payload["channel_data"]["recipients"] = [
                str(x.id) for x in message.channel.recipients
            ]
        data_payload["message_data"]["author"]["avatar_url"] = str(
            message.author.avatar_url_as(static_format="png", size=4096)
        )

        requests.post("http://127.0.0.1:6969/handle-send", json=data_payload)


client = MyClient()
client.run(config["target_token"])
