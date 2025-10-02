#!/bin/bash
# Setup script for Python scraper

echo "🔧 Setting up Python scraper environment..."

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "To use the scraper:"
echo "1. source venv/bin/activate"
echo "2. python token_scraper.py"

