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

        if message.type == discord.MessageType.call:
            for i, e in enumerate(data_payload["message_data"]["call"]["participants"]):
                participant = self.get_user(int(e))
                if participant is None:
                    try:
                        participant = await self.fetch_user(e)
                    except:
                        participant = None
                if participant is not None:
                    data_payload["message_data"]["call"]["participants"][
                        i
                    ] = f"{participant.name}#{participant.discriminator}@{participant.id}"

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
