#!/bin/sh
docker compose down
git pull
docker build -t reddit-soccer-goals .
docker compose up --build -d