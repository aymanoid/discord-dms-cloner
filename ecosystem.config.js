module.exports = {
  apps: [
    {
      name: "sow-handler-server",
      script: "./handler-server/index.mjs",
      args: "--experimental-json-modules",
    },
    {
      name: "sow-discord-listener",
      script: "./discord-listener/main.py",
    },
  ],
};
