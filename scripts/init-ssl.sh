#!/bin/bash

# SSL Certificate Initialization Script
# Usage: bash scripts/init-ssl.sh <domain> <email>

set -e

if [ $# -lt 2 ]; then
    echo "Usage: bash scripts/init-ssl.sh <domain> <email>"
    echo "Example: bash scripts/init-ssl.sh example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2
DOCKER_COMPOSE_FILE=${3:-"docker-compose.prod.yml"}

echo "🔐 Initializing SSL certificate for domain: $DOMAIN"
echo "📧 Certificate notifications will be sent to: $EMAIL"
echo ""

# Step 1: Verify nginx.conf has been updated
echo "✅ Step 1: Checking nginx.conf configuration..."
if grep -q "YOUR_DOMAIN" nginx.conf; then
    echo "⚠️  WARNING: nginx.conf still contains placeholder 'YOUR_DOMAIN'"
    echo "   Please update nginx.conf with your actual domain first:"
    echo "   Replace 'YOUR_DOMAIN' with '$DOMAIN'"
    echo ""
    read -p "Have you updated nginx.conf? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Aborted. Please update nginx.conf and run this script again."
        exit 1
    fi
fi

# Step 2: Verify domain DNS is configured
echo ""
echo "✅ Step 2: Verifying DNS configuration..."
if ! nslookup "$DOMAIN" > /dev/null 2>&1; then
    echo "⚠️  WARNING: DNS lookup for $DOMAIN failed"
    echo "   Make sure your domain DNS is properly configured and pointing to this server"
    read -p "Continue anyway? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Aborted."
        exit 1
    fi
fi

# Step 3: Create necessary directories
echo ""
echo "✅ Step 3: Creating certificate directories..."
sudo mkdir -p /etc/letsencrypt
sudo mkdir -p /var/lib/letsencrypt
sudo chmod 755 /etc/letsencrypt
sudo chmod 755 /var/lib/letsencrypt

# Step 4: Start only nginx for certificate validation
echo ""
echo "✅ Step 4: Starting Nginx for certificate validation..."
docker compose -f "$DOCKER_COMPOSE_FILE" up -d nginx

# Wait for Nginx to be ready
echo "   Waiting for Nginx to be ready..."
sleep 3

# Step 5: Obtain certificate with certbot
echo ""
echo "✅ Step 5: Requesting SSL certificate from Let's Encrypt..."
docker run --rm \
    -v /etc/letsencrypt:/etc/letsencrypt \
    -v /var/lib/letsencrypt:/var/lib/letsencrypt \
    -p 80:80 \
    certbot/certbot:latest \
    certonly \
    --standalone \
    --agree-tos \
    --no-eff-email \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL certificate successfully obtained!"
    echo ""
    echo "📝 Certificate Details:"
    echo "   Location: /etc/letsencrypt/live/$DOMAIN/"
    echo "   Renewal: Automatic (every 90 days)"
    echo ""
else
    echo ""
    echo "❌ Failed to obtain SSL certificate"
    echo "   Please check the error messages above"
    exit 1
fi

# Step 6: Stop nginx and start full stack
echo ""
echo "✅ Step 6: Starting full application stack..."
docker compose -f "$DOCKER_COMPOSE_FILE" down
docker compose -f "$DOCKER_COMPOSE_FILE" up -d

echo ""
echo "✅ ========================================="
echo "   SSL Setup Complete!"
echo "========================================="
echo ""
echo "Your application is now available at:"
echo "   🌐 https://$DOMAIN"
echo ""
echo "Certificate will auto-renew every 90 days"
echo "Next renewal: $(date -d '+88 days' '+%Y-%m-%d')"
echo ""
echo "📊 Monitor certificate status:"
echo "   docker exec certbot-philip-take-off-prod-1 certbot certificates"
echo ""
echo "🔄 Manual renewal (if needed):"
echo "   docker exec certbot-philip-take-off-prod-1 certbot renew --force-renewal"
echo ""
