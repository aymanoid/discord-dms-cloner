import imp
import discord
import config
from telegram_handler import telegram_handler


class MyClient(discord.Client):
    async def on_connect(self):
        print("Connected as", self.user)
        await client.change_presence(status=discord.Status.dnd, afk=True)

    async def on_message(self, message):
        if message.channel.type != "private":
            return

        if config.telegram["enabled"]:
            await telegram_handler(message)


client = MyClient()
client.run(config.discord_token)
