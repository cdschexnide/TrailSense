#!/bin/bash

# Copy Model Files to Android Assets
# ===================================
# This script copies the converted LLM model files to the Android assets directory

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="$HOME/llm-models/gemma-3n-e2b-executorch"
DEST_DIR="/Users/home/Documents/Project/TrailSense/android/app/src/main/assets"
MODEL_FILE="gemma-3n-e2b-int4.pte"
TOKENIZER_FILE="tokenizer.bin"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}TrailSense - Copy Model Files${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Error: Source directory not found!${NC}"
    echo -e "${YELLOW}Expected: $SOURCE_DIR${NC}"
    echo -e "\n${YELLOW}Please run the model conversion script first:${NC}"
    echo -e "  python3 convert_gemma3n.py"
    exit 1
fi

# Check if model file exists
if [ ! -f "$SOURCE_DIR/$MODEL_FILE" ]; then
    echo -e "${RED}❌ Error: Model file not found!${NC}"
    echo -e "${YELLOW}Expected: $SOURCE_DIR/$MODEL_FILE${NC}"
    echo -e "\n${YELLOW}Please run the model conversion script first.${NC}"
    exit 1
fi

# Check if tokenizer file exists
if [ ! -f "$SOURCE_DIR/$TOKENIZER_FILE" ]; then
    echo -e "${YELLOW}⚠️  Warning: Tokenizer file not found!${NC}"
    echo -e "${YELLOW}Expected: $SOURCE_DIR/$TOKENIZER_FILE${NC}"
    echo -e "\nLooking for alternative tokenizer files..."

    # Try to find tokenizer.model or other common names
    if [ -f "$SOURCE_DIR/tokenizer.model" ]; then
        echo -e "${GREEN}Found: tokenizer.model${NC}"
        echo "Copying as tokenizer.bin..."
        cp "$SOURCE_DIR/tokenizer.model" "$SOURCE_DIR/$TOKENIZER_FILE"
    elif [ -f "$SOURCE_DIR/spiece.model" ]; then
        echo -e "${GREEN}Found: spiece.model${NC}"
        echo "Copying as tokenizer.bin..."
        cp "$SOURCE_DIR/spiece.model" "$SOURCE_DIR/$TOKENIZER_FILE"
    else
        echo -e "${RED}❌ No tokenizer file found!${NC}"
        echo "The app may not work without a tokenizer."
        echo -e "\n${YELLOW}Do you want to continue anyway? (y/n)${NC}"
        read -r response
        if [ "$response" != "y" ]; then
            exit 1
        fi
    fi
fi

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Show file information
echo -e "\n${BLUE}Source Files:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$SOURCE_DIR/$MODEL_FILE" ]; then
    MODEL_SIZE=$(ls -lh "$SOURCE_DIR/$MODEL_FILE" | awk '{print $5}')
    echo -e "${GREEN}✓${NC} Model:     $MODEL_FILE ($MODEL_SIZE)"
else
    echo -e "${RED}✗${NC} Model:     $MODEL_FILE (NOT FOUND)"
fi

if [ -f "$SOURCE_DIR/$TOKENIZER_FILE" ]; then
    TOK_SIZE=$(ls -lh "$SOURCE_DIR/$TOKENIZER_FILE" | awk '{print $5}')
    echo -e "${GREEN}✓${NC} Tokenizer: $TOKENIZER_FILE ($TOK_SIZE)"
else
    echo -e "${YELLOW}⚠${NC} Tokenizer: $TOKENIZER_FILE (NOT FOUND)"
fi

echo ""

# Ask for confirmation
echo -e "${YELLOW}This will copy the model files to:${NC}"
echo -e "  $DEST_DIR"
echo ""
echo -e "${YELLOW}Continue? (y/n)${NC}"
read -r response

if [ "$response" != "y" ]; then
    echo -e "${YELLOW}Copy cancelled.${NC}"
    exit 0
fi

# Copy files
echo -e "\n${BLUE}Copying files...${NC}"

# Copy model file
if [ -f "$SOURCE_DIR/$MODEL_FILE" ]; then
    echo -n "Copying $MODEL_FILE... "
    cp "$SOURCE_DIR/$MODEL_FILE" "$DEST_DIR/"
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Model file not found!${NC}"
    exit 1
fi

# Copy tokenizer file
if [ -f "$SOURCE_DIR/$TOKENIZER_FILE" ]; then
    echo -n "Copying $TOKENIZER_FILE... "
    cp "$SOURCE_DIR/$TOKENIZER_FILE" "$DEST_DIR/"
    echo -e "${GREEN}✓${NC}"
fi

# Verify copied files
echo -e "\n${BLUE}Verifying copied files:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$DEST_DIR/$MODEL_FILE" ]; then
    DEST_MODEL_SIZE=$(ls -lh "$DEST_DIR/$MODEL_FILE" | awk '{print $5}')
    echo -e "${GREEN}✓${NC} $DEST_DIR/$MODEL_FILE ($DEST_MODEL_SIZE)"
else
    echo -e "${RED}✗ Model file not found in destination!${NC}"
fi

if [ -f "$DEST_DIR/$TOKENIZER_FILE" ]; then
    DEST_TOK_SIZE=$(ls -lh "$DEST_DIR/$TOKENIZER_FILE" | awk '{print $5}')
    echo -e "${GREEN}✓${NC} $DEST_DIR/$TOKENIZER_FILE ($DEST_TOK_SIZE)"
else
    echo -e "${YELLOW}⚠${NC} Tokenizer file not found in destination!"
fi

# Show disk usage
echo -e "\n${BLUE}Assets Directory Size:${NC}"
du -sh "$DEST_DIR" | awk '{print $1}'

echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}✅ Model files copied successfully!${NC}"
echo -e "${GREEN}======================================${NC}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Disable mock mode (see instructions in NEXT_STEPS.md)"
echo "2. Build the app: npm run android"
echo "3. Test on physical Android device"
echo ""
echo -e "${YELLOW}Note: The APK will be ~2GB larger due to the bundled model${NC}"
