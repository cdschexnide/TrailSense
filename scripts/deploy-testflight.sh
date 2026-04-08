#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

INFO_PLIST="ios/TrailSense/Info.plist"
ARCHIVE_DIR="$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)"
EXPORT_OPTIONS="ios/ExportOptions.plist"

# --- Determine build number ---
CURRENT=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST" 2>/dev/null || echo "1.0.0")
# Increment the last component: 1.0.3 -> 1.0.4
NEXT=$(echo "$CURRENT" | awk -F. '{$NF=$NF+1; print}' OFS=.)

# Allow override: ./scripts/deploy-testflight.sh 1.0.5
BUILD_NUMBER="${1:-$NEXT}"

echo "=== Build number: $BUILD_NUMBER (was $CURRENT) ==="

# --- Prebuild ---
echo "=== Prebuild ==="
npx expo prebuild --platform ios --clean

# --- Set build number in Info.plist (prebuild resets it) ---
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$INFO_PLIST"
echo "=== Set CFBundleVersion to $BUILD_NUMBER ==="

# --- Pod install ---
echo "=== Pod Install ==="
cd ios && pod install && cd ..

# --- Archive ---
echo "=== Archive ==="
ARCHIVE_PATH="$ARCHIVE_DIR/TrailSense-$BUILD_NUMBER.xcarchive"
xcodebuild archive \
  -workspace ios/TrailSense.xcworkspace \
  -scheme TrailSense \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM=QATL26RGAU \
  CODE_SIGN_STYLE=Automatic

# --- Verify build number ---
ARCHIVED_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$ARCHIVE_PATH/Info.plist")
echo "=== Archived as version 1.0.0 ($ARCHIVED_VERSION) ==="

# --- Export & upload ---
echo "=== Uploading to App Store Connect ==="
EXPORT_PATH="/tmp/TrailSense-export-$BUILD_NUMBER"
rm -rf "$EXPORT_PATH"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS"

echo ""
echo "=== Done! ==="
echo "Build 1.0.0 ($BUILD_NUMBER) exported to $EXPORT_PATH"
echo ""
echo "To upload to TestFlight:"
echo "  1. Open Xcode > Window > Organizer"
echo "  2. Select the TrailSense $BUILD_NUMBER archive"
echo "  3. Click Distribute App > App Store Connect"
echo ""
echo "Or set up an App Store Connect API key for automated uploads."
