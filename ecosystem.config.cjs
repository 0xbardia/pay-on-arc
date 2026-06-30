module.exports = {
  apps: [
    {
      name: "pay-on-arc-web",
      script: "pnpm",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "768M",
      restart_delay: 3000,
    },
    {
      name: "pay-on-arc-worker",
      script: "pnpm",
      args: "worker",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "512M",
      restart_delay: 3000,
    },
  ],
};
