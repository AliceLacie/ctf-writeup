#!/bin/bash
while true; do
    echo "$(date): Docker Compose down"

    docker compose down -v --remove-orphans

    echo "$(date): Docker Compose start"
    docker compose up --build -d
    echo "$(date): service started"

    sleep 300
done