name: Deploy Backend to EC2

on:
  push:
    branches:
      - main  # Trigger on push to the main branch

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Step 1: Checkout the code
      - name: Checkout code
        uses: actions/checkout@v3

      # Step 2: Log in to Docker Hub (if you're using Docker Hub to store images)
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_TOKEN }}

      # Step 3: Build the Docker image
      - name: Build Docker image
        run: |
          docker build -t umarfarooq892/backend-app:latest

      # Step 4: Push the Docker image to Docker Hub
      - name: Push Docker image
        run: |
          docker push umarfarooq892/backend-app:latest

      # Step 5: Deploy to EC2 via SSH
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            # Navigate to the applications folder
            cd /home/ubuntu/applications

            # Pull the latest Docker image
            docker pull umarfarooq892/backend-app:latest

            # Stop and remove the existing container (if running)
            docker stop backend-container || true
            docker rm backend-container || true

            # Run the new container
            docker run -d \
              --name backend-container \
              -p 5000:5000 \
              umarfarooq892/backend-app:latest

            # Optional: Use PM2 to manage the Docker container
            pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js