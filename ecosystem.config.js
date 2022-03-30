module.exports = {
  apps: [
    {
      name: "sow-handler-server",
      script: "./handler-server/index.mjs",
    },
    {
      name: "sow-discord-listener",
      script: "./discord-listener/main.py",
    },
  ],
};
