#!/bin/bash

# Generate PlantUML diagrams to images
# Requires: plantuml or docker with plantuml image

DIAGRAMS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FORMAT="${1:-png}"  # png, svg, pdf

echo "📊 Generating PlantUML diagrams..."
echo "Format: $OUTPUT_FORMAT"
echo "Directory: $DIAGRAMS_DIR"

# Check if plantuml is installed
if command -v plantuml &> /dev/null; then
    echo "✓ PlantUML found, using local installation"
    
    for puml_file in "$DIAGRAMS_DIR"/*.puml; do
        if [ -f "$puml_file" ]; then
            filename=$(basename "$puml_file" .puml)
            echo "  → Generating $filename.$OUTPUT_FORMAT"
            plantuml -t$OUTPUT_FORMAT "$puml_file" -o "$DIAGRAMS_DIR"
        fi
    done
    
elif command -v docker &> /dev/null; then
    echo "✓ Docker found, using PlantUML Docker image"
    
    for puml_file in "$DIAGRAMS_DIR"/*.puml; do
        if [ -f "$puml_file" ]; then
            filename=$(basename "$puml_file")
            echo "  → Generating $filename"
            docker run --rm -v "$DIAGRAMS_DIR:/diagrams" plantuml/plantuml:latest \
                -t$OUTPUT_FORMAT "/diagrams/$filename" -o "/diagrams"
        fi
    done
    
else
    echo "❌ Error: Neither plantuml nor docker found"
    echo ""
    echo "Install PlantUML:"
    echo "  - macOS: brew install plantuml"
    echo "  - Ubuntu/Debian: sudo apt install plantuml"
    echo "  - Or install Docker: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo ""
echo "✅ Diagram generation complete!"
echo ""
echo "Generated images:"
ls -lh "$DIAGRAMS_DIR"/*.{png,svg,pdf} 2>/dev/null | awk '{print "  ", $NF}'
