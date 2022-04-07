from utils import avatar_url


async def message_send_payload(client, message_id, channel):
    raw_message = await client.http.get_message(
        message_id=message_id, channel_id=channel.id
    )
    data_payload = {
        "kind": "MESSAGE_SEND",
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


async def message_edit_payload(client, message_id, channel):
    raw_message = await client.http.get_message(
        message_id=message_id, channel_id=channel.id
    )
    data_payload = {
        "kind": "MESSAGE_EDIT",
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
