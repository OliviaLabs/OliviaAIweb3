#!/bin/bash

# Script to install the cron job for token scraper

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_COMMAND="0 */6 * * * $SCRIPT_DIR/run-scraper.sh"

echo "🔧 Installing cron job for token scraper..."
echo ""
echo "This will run the scraper every 6 hours at:"
echo "  - 12:00 AM"
echo "  - 6:00 AM"
echo "  - 12:00 PM"
echo "  - 6:00 PM"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "run-scraper.sh"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep "run-scraper.sh"
    echo ""
    read -p "Do you want to remove and reinstall? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    # Remove existing cron job
    crontab -l | grep -v "run-scraper.sh" | crontab -
    echo "✅ Removed existing cron job"
fi

# Make run-scraper.sh executable
chmod +x "$SCRIPT_DIR/run-scraper.sh"

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo "✅ Cron job installed successfully!"
echo ""
echo "Cron expression: $CRON_COMMAND"
echo ""
echo "To view your cron jobs:"
echo "  crontab -l"
echo ""
echo "To remove this cron job:"
echo "  crontab -e"
echo "  (then delete the line with 'run-scraper.sh')"
echo ""
echo "To test the scraper manually:"
echo "  $SCRIPT_DIR/run-scraper.sh"
echo ""
echo "Logs will be saved to:"
echo "  $SCRIPT_DIR/scraper/scraper.log"
echo "  $SCRIPT_DIR/scraper/scraper_error.log"

