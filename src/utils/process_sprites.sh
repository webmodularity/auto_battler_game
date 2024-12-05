#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first."
    exit 1
fi

# Check if input directory is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <input_directory> [--v2]"
    echo "Example: $0 ./sprites"
    echo "Example: $0 ./sprites --v2"
    exit 1
fi

# Setup directories and flags
input_dir="${1%/}"  # Remove trailing slash if present
output_dir="${input_dir}/processed"
CANVAS_SIZE=300     # Increased from 256

# Check for V2 flag
if [ "$2" == "--v2" ]; then
    IS_V2_ART=true
    NUDGE_UP=22
    echo "V2 mode enabled - NUDGE_UP set to: $NUDGE_UP"
else
    IS_V2_ART=false
    echo "V2 mode disabled"
fi

mkdir -p "$output_dir"

echo "Processing sprites..."
echo "Input directory: $input_dir"
echo "Output directory: $output_dir"

# Directory name mapping
declare -A dir_map=(
    ["Dying"]="dying"
    ["Hurt"]="hurt"
    ["Idle"]="idle"
    ["Kicking"]="blocking"
    ["Running"]="running"
    ["Sliding"]="dodging"
    ["Swinging Rod"]="attacking"
    ["Slashing"]="attacking"
    ["Throwing"]="taunting"
    ["Walking"]="walking"
)

# Add prefix patterns to remove
declare -a prefixes_to_remove=(
    "0_Knight_"
    # Add any other prefixes here
)

process_animation_directory() {
    local dir="$1"
    local new_dir_name="$2"
    
    for file in "$dir"/*.png; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            
            # Extract just the sequence number and extension
            sequence_number=$(echo "$filename" | grep -o '[0-9]\+\.png' | head -1)
            new_filename="${new_dir_name}_${sequence_number}"
            
            echo "  Converting: '$filename' -> '$new_filename'"
            
            if [ "$IS_V2_ART" = true ]; then
                echo "  Applying V2 processing with NUDGE_UP=$NUDGE_UP"
                convert "$file" \
                    -roll +0-${NUDGE_UP} \
                    -resize "${CANVAS_SIZE}x${CANVAS_SIZE}" \
                    -background transparent \
                    -gravity south \
                    -extent ${CANVAS_SIZE}x${CANVAS_SIZE} \
                    "$output_dir/$new_dir_name/$new_filename"
            else
                # For V1 art: process normally
                convert "$file" \
                    -resize "${CANVAS_SIZE}x${CANVAS_SIZE}" \
                    -background transparent \
                    -gravity south \
                    -extent ${CANVAS_SIZE}x${CANVAS_SIZE} \
                    "$output_dir/$new_dir_name/$new_filename"
            fi
        fi
    done
}

# Process each animation directory
for dir in "$input_dir"/*/ ; do
    if [ -d "$dir" ]; then
        base_dir=$(basename "$dir")
        
        # Skip the processed directory
        if [ "$base_dir" == "processed" ]; then
            continue
        fi
        
        # Get new directory name from mapping
        new_dir_name="${dir_map[$base_dir]}"
        
        if [ -z "$new_dir_name" ]; then
            echo "Skipping unknown animation type: $base_dir"
            continue
        fi
        
        # Create output subdirectory
        mkdir -p "$output_dir/$new_dir_name"
        
        echo "Processing directory: $base_dir -> $new_dir_name"
        process_animation_directory "$dir" "$new_dir_name"
    fi
done

echo "✓ Processing complete! Sprites saved to: $output_dir"