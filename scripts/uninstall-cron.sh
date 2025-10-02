#!/bin/bash

# Script to uninstall the token scraper cron job

echo "🗑️  Uninstalling token scraper cron job..."
echo ""

# Check if cron job exists
if crontab -l 2>/dev/null | grep -q "run-scraper.sh"; then
    echo "Found cron job:"
    crontab -l | grep "run-scraper.sh"
    echo ""
    
    read -p "Do you want to remove this cron job? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove cron job
        crontab -l | grep -v "run-scraper.sh" | crontab -
        echo "✅ Cron job removed successfully!"
    else
        echo "Uninstallation cancelled."
    fi
else
    echo "⚠️  No cron job found for run-scraper.sh"
fi

