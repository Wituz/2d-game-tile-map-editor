#!/bin/bash

# Launch script for map-editor with proper environment variables
# Fixes Wayland/GBM issues on Linux

# Try X11 backend first (most compatible)
export GDK_BACKEND=x11

# Disable hardware acceleration if needed
export WEBKIT_DISABLE_COMPOSITING_MODE=1

# Alternative: use software rendering
# export LIBGL_ALWAYS_SOFTWARE=1

echo "Starting map-editor with X11 backend..."
npm run tauri dev
