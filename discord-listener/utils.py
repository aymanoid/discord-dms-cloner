def avatar_url(avatar, user_id, discriminator):
    if avatar is None:
        index = int(discriminator) % 5
        return f"https://cdn.discordapp.com/embed/avatars/{index}.png"
    animated = avatar.startswith("a_")
    format = "gif" if animated else "png"
    return f"https://cdn.discordapp.com/avatars/{user_id}/{avatar}.{format}?size=4096"
