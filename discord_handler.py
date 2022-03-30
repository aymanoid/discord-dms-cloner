import config
import discord


async def discord_handler(dc_client, dc_message):
    archive_guild = dc_client.get_guild(config.discord["archive_guild"])
    archive_category = discord.utils.find(
        lambda m: m.name.endswith(f"{dc_client.user.id}_DMS"), archive_guild.categories
    )

    if archive_category is None:
        archive_category = await archive_guild.create_category_channel(
            name=f"{dc_client.user} DMs - {dc_client.user.id}_DMS"
        )

    archive_channel = discord.utils.find(
        lambda m: isinstance(m.topic, str)
        and m.topic.endswith(f"{dc_message.channel.id}_DMS"),
        archive_guild.text_channels,
    )

    if archive_channel is None:

        if str(dc_message.channel.type) == "private":
            archive_channel_name = str(dc_message.channel.recipient.name)
            archive_channel_topic = f"{dc_message.channel}\n- ID: {dc_message.channel.recipient.id}\n- {dc_message.channel.id}_DMS"
        if str(dc_message.channel.type) == "group":
            archive_channel_name = str(dc_message.channel)
            archive_channel_topic = f"{dc_message.channel}\n- IDs: {' , '.join([str(x.id) for x in dc_message.channel.recipients])}\n- {dc_message.channel.id}_DMS"

        if len(archive_channel_name) > 100:
            archive_channel_name = archive_channel_name[0:100]
        if len(archive_channel_topic) > 1024:
            archive_channel_topic = f"{dc_message.channel.id}_DMS"

        archive_channel = await archive_guild.create_text_channel(
            name=archive_channel_name,
            topic=archive_channel_topic,
            category=archive_category,
        )

    channel_webhooks = await archive_channel.webhooks()
    archive_webhook = discord.utils.find(
        lambda m: m.name.endswith(f"{dc_message.channel.id}_WH"),
        channel_webhooks,
    )

    if archive_webhook is None:
        archive_webhook = await archive_channel.create_webhook(
            name=f"{dc_message.channel.id}_WH"
        )

    message_files = [await x.to_file() for x in dc_message.attachments]
    message_content = dc_message.content

    raw_message = await dc_client.http.get_message(
        message_id=dc_message.id, channel_id=dc_message.channel.id
    )
    if "sticker_items" in raw_message:
        for sticker in raw_message["sticker_items"]:
            sticker_name = sticker["name"]
            message_content += f"\n`[sticker: {sticker_name}]`"

    await archive_webhook.send(
        content=message_content,
        username=dc_message.author.name,
        avatar_url=dc_message.author.avatar_url,
        files=message_files,
        embeds=dc_message.embeds,
    )
