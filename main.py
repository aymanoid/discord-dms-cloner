import discord
import config
from telegram_handler import telegram_handler
from discord_handler import discord_handler


class MyClient(discord.Client):
    async def on_connect(self):
        print("Connected as", self.user)
        await client.change_presence(status=discord.Status.dnd, afk=True)

    async def on_message(self, message):
        if str(message.channel.type) not in ("private", "group"):
            return

        if config.discord["enabled"]:
            await discord_handler(self, message)

        if config.telegram["enabled"]:
            telegram_handler(message)


client = MyClient()
client.run(config.discord_token)
