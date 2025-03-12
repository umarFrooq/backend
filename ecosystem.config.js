module.exports = {
    apps: [
      {
        name: "backend-app",
        script: "docker",
        args: "run -d --name backend-container -p 5000:5000 umarfarooq892/backend-app:latest",
        autorestart: true,
        watch: false,
        env: {
          NODE_ENV: "production",
        },
      },
    ],
  };