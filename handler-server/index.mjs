import Fastify from "fastify";
import { readFile } from "fs/promises";
import { Client } from "discord.js";
import discordHandler from "./discord-handler.mjs";

const fastify = Fastify({
  logger: true,
});
const config = JSON.parse(
  await readFile(new URL("../config.json", import.meta.url))
);

let client;
if (config.discord.enabled) {
  client = new Client({ intents: 32767 });
  client.login(config.discord.admin_bot);
}

fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

fastify.post("/handle-send", async (request, reply) => {
  const promises = [];
  if (config.discord.enabled) {
    promises.push(discordHandler(config, client, request.body));
  }
  await Promise.all(promises);
  reply.send({ done: "yes" });
});

fastify.listen(6969, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});
