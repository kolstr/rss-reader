# How to Update the Docker Container

After pulling changes from git, you need to rebuild the Docker image:

```bash
# Stop and remove the container
docker-compose down

# Pull latest changes
git pull

# Rebuild and start (the --build flag forces a rebuild)
docker-compose up -d --build
```

## Alternative: Separate Build Step

```bash
docker-compose down
git pull
docker-compose build
docker-compose up -d
```

## Why is this needed?

`docker-compose up` uses cached images if they exist. When you update the code, the image needs to be rebuilt to include your changes. The `--build` flag forces Docker to rebuild the image even if one already exists.
