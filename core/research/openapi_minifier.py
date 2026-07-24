#!/usr/bin/env python3
"""
OpenAPI JSON Minifier
Removes non-essential metadata and minifies OpenAPI specifications for LLM consumption.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict

def remove_non_essential_fields(data: Any, path: str = "") -> Any:
    """
    Recursively remove non-essential fields from OpenAPI spec.
    
    Fields removed:
    - examples (keep example, remove examples array to save space)
    - description fields (optional - uncomment to remove)
    - externalDocs
    - x-* vendor extensions
    - deprecated fields
    - summary (keep operationId, remove summary)
    """
    if isinstance(data, dict):
        # Fields to always remove
        fields_to_remove = [
            'examples',  # Keep 'example', remove 'examples'
            'externalDocs',
            'deprecated',
            'xml',  # XML formatting hints
        ]
        
        # Optionally remove descriptions (uncomment if you want more aggressive minification)
        # fields_to_remove.append('description')
        
        cleaned = {}
        for key, value in data.items():
            # Remove vendor extensions (x-*)
            if key.startswith('x-'):
                continue
            
            # Remove fields in removal list
            if key in fields_to_remove:
                continue
            
            # For summary, only keep if there's no operationId
            if key == 'summary' and 'operationId' in data:
                continue
            
            # Recursively clean nested structures
            cleaned[key] = remove_non_essential_fields(value, f"{path}.{key}")
        
        return cleaned
    
    elif isinstance(data, list):
        return [remove_non_essential_fields(item, f"{path}[]") for item in data]
    
    else:
        return data

def minify_openapi(input_file: str, output_file: str = None, remove_descriptions: bool = False) -> None:
    """
    Minify an OpenAPI JSON file by removing non-essential metadata.
    
    Args:
        input_file: Path to input OpenAPI JSON file
        output_file: Path to output file (if None, will add .min.json suffix)
        remove_descriptions: If True, also remove all description fields
    """
    input_path = Path(input_file)
    
    if not input_path.exists():
        print(f"Error: File '{input_file}' not found.")
        sys.exit(1)
    
    # Determine output file path
    if output_file is None:
        output_path = input_path.with_suffix('.min.json')
    else:
        output_path = Path(output_file)
    
    # Load the OpenAPI spec
    print(f"Loading {input_file}...")
    with open(input_path, 'r', encoding='utf-8-sig') as f:  # utf-8-sig tolerates a BOM
        openapi_spec = json.load(f)
    
    original_size = len(json.dumps(openapi_spec))
    
    # Remove non-essential fields
    print("Removing non-essential metadata...")
    cleaned_spec = remove_non_essential_fields(openapi_spec)
    
    # Optionally remove descriptions
    if remove_descriptions:
        print("Removing descriptions...")
        def strip_descriptions(obj):
            if isinstance(obj, dict):
                return {k: strip_descriptions(v) for k, v in obj.items() if k != 'description'}
            elif isinstance(obj, list):
                return [strip_descriptions(item) for item in obj]
            return obj
        cleaned_spec = strip_descriptions(cleaned_spec)
    
    # Write minified JSON (no whitespace)
    print(f"Writing minified output to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_spec, f, separators=(',', ':'), ensure_ascii=False)
    
    minified_size = len(json.dumps(cleaned_spec, separators=(',', ':')))
    reduction = ((original_size - minified_size) / original_size) * 100
    
    print(f"\nComplete!")
    print(f"Original size: {original_size:,} bytes")
    print(f"Minified size: {minified_size:,} bytes")
    print(f"Reduction: {reduction:.1f}%")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Minify OpenAPI JSON files for LLM consumption'
    )
    parser.add_argument(
        'input_file',
        help='Input OpenAPI JSON file'
    )
    parser.add_argument(
        '-o', '--output',
        help='Output file path (default: input_file.min.json)'
    )
    parser.add_argument(
        '--remove-descriptions',
        action='store_true',
        help='Also remove description fields (more aggressive minification)'
    )
    
    args = parser.parse_args()
    
    minify_openapi(args.input_file, args.output, args.remove_descriptions)

if __name__ == '__main__':
    main()