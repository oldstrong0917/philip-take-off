#!/bin/bash

# Manual SSL Certificate Renewal Script
# Usage: bash scripts/renew-ssl-manual.sh [domain]

set -e

DOMAIN=${1:-""}
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

echo "🔄 SSL Certificate Renewal"
echo "================================"
echo ""

if [ -z "$DOMAIN" ]; then
    echo "Usage: bash scripts/renew-ssl-manual.sh [domain]"
    echo ""
    echo "Current certificates:"
    echo ""
    sudo certbot certificates 2>/dev/null || echo "No certificates found"
    echo ""
    read -p "Enter domain to renew (or 'all' for all domains): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        echo "❌ No domain specified"
        exit 1
    fi
fi

if [ "$DOMAIN" = "all" ]; then
    echo "🔄 Renewing all certificates..."
    docker run --rm \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/lib/letsencrypt:/var/lib/letsencrypt \
        -p 80:80 \
        certbot/certbot:latest \
        renew --force-renewal
else
    echo "🔄 Renewing certificate for: $DOMAIN"
    docker run --rm \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/lib/letsencrypt:/var/lib/letsencrypt \
        -p 80:80 \
        certbot/certbot:latest \
        renew --force-renewal -d "$DOMAIN"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Certificate renewed successfully!"
    echo ""
    echo "🔄 Reloading Nginx..."
    docker compose -f "$DOCKER_COMPOSE_FILE" exec nginx nginx -s reload
    echo "✅ Nginx reloaded"
    echo ""
else
    echo ""
    echo "❌ Certificate renewal failed"
    exit 1
fi

echo "📊 Current certificate status:"
sudo certbot certificates
echo ""
