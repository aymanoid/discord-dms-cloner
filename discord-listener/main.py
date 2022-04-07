from http import client
import json
from os import environ
from dotenv import load_dotenv
import asyncio
import discord
import requests
from collections import namedtuple

load_dotenv()
config = json.loads(environ.get("SOW_CONFIG"))


def avatar_url(avatar, user_id, discriminator):
    if avatar is None:
        index = int(discriminator) % 5
        return f"https://cdn.discordapp.com/embed/avatars/{index}.png"
    animated = avatar.startswith("a_")
    format = "gif" if animated else "png"
    return f"https://cdn.discordapp.com/avatars/{user_id}/{avatar}.{format}?size=4096"


async def generate_payload(client, message_id, channel, kind):
    raw_message = await client.http.get_message(
        message_id=message_id, channel_id=channel.id
    )
    data_payload = {
        "kind": kind,
        "target_data": {"id": str(client.user.id), "tag": str(client.user)},
        "channel_data": {
            "id": str(channel.id),
            "name": str(channel),
            "type": str(channel.type),
        },
        "message_data": raw_message,
    }
    if data_payload["channel_data"]["type"] == "private":
        data_payload["channel_data"]["recipient"] = {
            "id": channel.recipient.id,
            "name": channel.recipient.name,
        }
    if data_payload["channel_data"]["type"] == "group":
        data_payload["channel_data"]["recipients"] = [
            str(x.id) for x in channel.recipients
        ]
    data_payload["message_data"]["author"]["avatar_url"] = avatar_url(
        raw_message["author"]["avatar"],
        raw_message["author"]["id"],
        raw_message["author"]["discriminator"],
    )

    if raw_message["type"] == 3:
        for i, e in enumerate(raw_message["call"]["participants"]):
            try:
                participant = client.get_user(int(e)) or await client.fetch_user(e)
                data_payload["message_data"]["call"]["participants"][
                    i
                ] = f"{participant.name}#{participant.discriminator}@{participant.id}"
            except:
                pass

    return data_payload


class MyClient(discord.Client):
    async def on_connect(self):
        print("Connected as", self.user)
        await self.change_presence(status=discord.Status.dnd, afk=True)

    async def on_ready(self):
        print("Ready as", self.user)
        await self.change_presence(status=discord.Status.dnd, afk=True)

    async def on_message(self, message):
        if str(message.channel.type) not in ("private", "group"):
            return

        data_payload = await generate_payload(
            self, message.id, message.channel, "MESSAGE_SEND"
        )

        requests.post("http://127.0.0.1:6969/handle-send", json=data_payload)

    async def on_raw_message_edit(self, payload):
        target_channel = self.get_channel(
            payload.channel_id
        ) or await self.fetch_channel(int(payload.channel_id))

        if str(target_channel.type) not in ("private", "group"):
            return

        data_payload = await generate_payload(
            self, payload.message_id, target_channel, "MESSAGE_EDIT"
        )

        requests.post("http://127.0.0.1:6969/handle-send", json=data_payload)


# First, we must attach an event signalling when the bot has been
# closed to the client itself so we know when to fully close the event loop.

Entry = namedtuple("Entry", "client event token")
entries = [
    Entry(
        client=MyClient(),
        event=asyncio.Event(),
        token=token,
    )
    for token in config["target_tokens"]
]

# Then, we should login to all our clients and wrap the connect call
# so it knows when to do the actual full closure

loop = asyncio.get_event_loop()


async def login():
    for e in entries:
        await e.client.login(e.token)


async def wrapped_connect(entry):
    try:
        await entry.client.connect()
    except Exception as e:
        await entry.client.close()
        print("We got an exception: ", e.__class__.__name__, e)
        entry.event.set()


# actually check if we should close the event loop:
async def check_close():
    futures = [e.event.wait() for e in entries]
    await asyncio.wait(futures)


# here is when we actually login
loop.run_until_complete(login())

# now we connect to every client
for entry in entries:
    loop.create_task(wrapped_connect(entry))

# now we're waiting for all the clients to close
loop.run_until_complete(check_close())

# finally, we close the event loop
loop.close()
