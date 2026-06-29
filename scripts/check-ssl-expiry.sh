#!/bin/bash

# SSL Certificate Expiry Check Script
# Shows certificate expiration dates and days remaining

set -e

echo "📅 SSL Certificate Status"
echo "================================"
echo ""

if ! command -v sudo &> /dev/null; then
    SUDO=""
else
    SUDO="sudo"
fi

# Check if certificates exist
if [ ! -d "/etc/letsencrypt/live" ]; then
    echo "❌ No certificates found at /etc/letsencrypt/live"
    echo ""
    echo "To set up certificates, run:"
    echo "  bash scripts/init-ssl.sh <domain> <email>"
    exit 1
fi

# Function to check certificate expiry
check_cert() {
    local cert_path=$1
    local domain=$2
    
    if [ ! -f "$cert_path" ]; then
        echo "⚠️  Certificate not found: $cert_path"
        return 1
    fi
    
    local expiry_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
    local expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch=$(date +%s)
    local days_remaining=$(( ($expiry_epoch - $current_epoch) / 86400 ))
    
    if [ $days_remaining -lt 0 ]; then
        echo "❌ $domain: EXPIRED ($(( $days_remaining * -1 )) days ago)"
        return 1
    elif [ $days_remaining -lt 7 ]; then
        echo "🚨 $domain: EXPIRING SOON - $days_remaining days remaining"
        return 1
    elif [ $days_remaining -lt 30 ]; then
        echo "⚠️  $domain: $days_remaining days remaining"
        return 0
    else
        echo "✅ $domain: $days_remaining days remaining (expires $expiry_date)"
        return 0
    fi
}

# Check all certificates
found_any=false
for live_dir in $($SUDO ls -d /etc/letsencrypt/live/*/ 2>/dev/null || echo ""); do
    if [ -d "$live_dir" ]; then
        domain=$(basename "$live_dir")
        cert_path="${live_dir}fullchain.pem"
        
        found_any=true
        check_cert "$cert_path" "$domain"
        echo ""
    fi
done

if [ "$found_any" = false ]; then
    echo "❌ No certificates found"
    echo ""
    echo "To set up certificates, run:"
    echo "  bash scripts/init-ssl.sh <domain> <email>"
    exit 1
fi

echo "================================"
echo "ℹ️  Certificate renewal is automatic"
echo "   Renewal attempts happen every 12 hours"
echo "   Let's Encrypt renews within 30 days before expiry"
echo ""
echo "To manually renew:"
echo "  bash scripts/renew-ssl-manual.sh"
echo ""
