#!/bin/sh
set -e

# Get host Docker group ID from socket
HOST_GID=$(stat -c '%g' /var/run/docker.sock)

# Update docker group ID in container
if [ "$HOST_GID" != "0" ]; then
    groupmod -g $HOST_GID docker
fi

# Add user to docker group
if ! id -nG "nodeuser" | grep -qw "docker"; then
    usermod -aG docker nodeuser
fi

exec "$@"