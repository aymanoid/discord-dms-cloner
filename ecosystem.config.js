module.exports = {
  apps: [
    {
      name: "sow-handler-server",
      script: "./handler-server/index.mjs",
      watch: true,
    },
    {
      name: "sow-discord-listener",
      script: "./discord-listener/main.py",
    },
  ],
};
