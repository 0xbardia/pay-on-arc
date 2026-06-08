module.exports = {
  apps: [
    {
      name: "arcpay-ai",
      script: "pnpm",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "768M",
      restart_delay: 3000,
    },
  ],
};
