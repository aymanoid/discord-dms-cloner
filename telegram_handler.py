from telethon import TelegramClient
import config


async def telegram_handler(discord_message):

    tg_client = TelegramClient(
        "nig", config.telegram["api_id"], config.telegram["api_hash"]
    )
    async with tg_client:
        await tg_client.send_message("me", discord_message.content)
