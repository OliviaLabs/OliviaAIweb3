#!/bin/bash

# Olivia AI Token Scraper - Cron Job Runner
# This script runs the token scraper and handles errors

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRAPER_DIR="$SCRIPT_DIR/scraper"
LOG_FILE="$SCRAPER_DIR/scraper.log"
ERROR_LOG="$SCRAPER_DIR/scraper_error.log"

# Timestamp for logs
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "===============================================" >> "$LOG_FILE"
echo "[$TIMESTAMP] Starting token scraper..." >> "$LOG_FILE"
echo "===============================================" >> "$LOG_FILE"

# Change to scraper directory
cd "$SCRAPER_DIR" || {
    echo "[$TIMESTAMP] ERROR: Could not change to scraper directory" >> "$ERROR_LOG"
    exit 1
}

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[$TIMESTAMP] ERROR: Virtual environment not found. Run setup.sh first." >> "$ERROR_LOG"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate || {
    echo "[$TIMESTAMP] ERROR: Could not activate virtual environment" >> "$ERROR_LOG"
    exit 1
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    # Try to load from .env file
    if [ -f "../../.env" ]; then
        export $(grep -v '^#' ../../.env | xargs)
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        echo "[$TIMESTAMP] ERROR: DATABASE_URL not set" >> "$ERROR_LOG"
        exit 1
    fi
fi

# Run the scraper
echo "[$TIMESTAMP] Running scraper..." >> "$LOG_FILE"
python token_scraper.py >> "$LOG_FILE" 2>> "$ERROR_LOG"

# Check exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "[$TIMESTAMP] ✅ Scraper completed successfully" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] ❌ Scraper failed with exit code $EXIT_CODE" >> "$ERROR_LOG"
    
    # Optional: Send notification (uncomment if you have ntfy or similar)
    # curl -d "Token scraper failed with exit code $EXIT_CODE" ntfy.sh/olivia-scraper-alerts
fi

# Deactivate virtual environment
deactivate

echo "[$TIMESTAMP] Scraper run finished" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

exit $EXIT_CODE

