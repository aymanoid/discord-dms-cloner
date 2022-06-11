from generators import message_send_payload, message_edit_payload
import json
from os import environ
from dotenv import load_dotenv
import asyncio
import discord
import requests
from collections import namedtuple

load_dotenv()
config = json.loads(environ.get("SOW_CONFIG"))
handler_host = environ.get("HANDLER_HOST") or "127.0.0.1"


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

        data_payload = await message_send_payload(self, message.id, message.channel)

        requests.post(f"http://{handler_host}:6969/handle-send", json=data_payload)

    async def on_raw_message_edit(self, payload):
        target_channel = self.get_channel(
            payload.channel_id
        ) or await self.fetch_channel(int(payload.channel_id))

        if str(target_channel.type) not in ("private", "group"):
            return

        data_payload = await message_edit_payload(
            self,
            payload.message_id,
            target_channel,
        )

        requests.post(f"http://{handler_host}:6969/handle-send", json=data_payload)


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
