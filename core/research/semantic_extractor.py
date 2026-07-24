#!/usr/bin/env python3
"""
Improved API Documentation Semantic Extractor
Enhanced version that reduces false positive endpoints while maintaining high recall
"""

import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import urlparse

class ImprovedSemanticExtractor:
    def __init__(self, api_docs_dir: str):
        self.api_docs_dir = Path(api_docs_dir)
        self.sections_data = None
        self.clean_text = ""
        self.crawl_report = None
        
        # Improved patterns
        self.http_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
        
        # More precise endpoint detection patterns
        self.endpoint_patterns = [
            # Standard format: METHOD /path with word boundaries
            r'\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(/[\w\-/{}.:\[\]]+)(?:\s|$|[^a-zA-Z])',
            # In code blocks or examples
            r'```[^`]*\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(/[\w\-/{}.:\[\]]+)',
            # With quotes or specific formatting
            r'"(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(/[\w\-/{}.:\[\]]+)"',
            # HTTP method on separate line followed by path (stricter)
            r'\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\n\s*(/[\w\-/{}.:\[\]]{3,})',
        ]
        
        # Authentication patterns
        self.auth_patterns = {
            'api_key': [
                r'api[_\s-]?key', r'x-api-key', r'authorization.*api[_\s-]?key',
                r'authenticate.*api[_\s-]?key', r'api[_\s-]?token'
            ],
            'bearer': [
                r'bearer\s+token', r'authorization:\s*bearer', r'bearer\s+auth',
                r'token\s+auth', r'jwt\s+token', r'access[_\s-]?token'
            ],
            'oauth': [
                r'oauth\s*2?\.?0?', r'client[_\s-]?credentials', r'authorization[_\s-]?code',
                r'refresh[_\s-]?token', r'oauth\s+flow'
            ],
            'basic': [
                r'basic\s+auth', r'http\s+basic', r'username.*password',
                r'basic\s+authentication'
            ]
        }
        
        # Improved code example patterns
        self.code_patterns = {
            'curl': [
                r'curl\s+[^\n]*(?:\n(?:\s*[^curl\n].*)?)*',
                r'```(?:bash|shell|curl)[^`]*```',
                r'```[^`]*curl[^`]*```'
            ],
            'json': [
                r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',
                r'```json[^`]*```',
                r'```[^`]*\{[^`]*\}[^`]*```'
            ],
            'javascript': [
                r'```(?:js|javascript)[^`]*```',
                r'fetch\s*\([^)]*\)',
                r'axios\.[a-z]+\s*\('
            ],
            'python': [
                r'```python[^`]*```',
                r'requests\.[a-z]+\s*\(',
                r'import\s+requests'
            ]
        }

    def load_data(self) -> bool:
        """Load all data files"""
        print("Loading data for improved extraction...")
        
        # Load sections
        sections_files = list(self.api_docs_dir.glob("*_sections.json"))
        if sections_files:
            with open(sections_files[0], 'r') as f:
                self.sections_data = json.load(f)
            print(f"Loaded {len(self.sections_data)} sections")
        else:
            print("No sections file found")
            return False
        
        # Load text
        text_files = list(self.api_docs_dir.glob("*_clean.txt"))
        if text_files:
            with open(text_files[0], 'r', encoding='utf-8') as f:
                self.clean_text = f.read()
            print(f"Loaded clean text ({len(self.clean_text):,} chars)")
        else:
            print("No clean text file found")
            return False
        
        # Load crawl report
        crawl_report_path = self.api_docs_dir / 'crawl_report.json'
        if crawl_report_path.exists():
            with open(crawl_report_path, 'r') as f:
                self.crawl_report = json.load(f)
        
        return True

    def is_valid_endpoint_path(self, path: str) -> bool:
        """Balanced validation for API paths - less restrictive but still filters false positives"""
        if not path or not path.startswith('/'):
            return False
        
        # Must contain valid characters only
        if not re.match(r'^/[\w\-/{}.:\[\]]+$', path):
            return False
        
        # Exclude obvious invalid indicators
        invalid_indicators = [
            'http://', 'https://', 'www.', '.com', '.html', '.css', '.js',
            'example.com', 'localhost', '127.0.0.1', 'curl', 'bash'
        ]
        
        path_lower = path.lower()
        if any(indicator in path_lower for indicator in invalid_indicators):
            return False
        
        # Exclude paths that end with method names (clear false positives)
        if re.search(r'-(get|post|put|patch|delete)$', path_lower):
            return False
        
        # Must be reasonable length
        if len(path) < 2 or len(path) > 120:  # Increased from 80
            return False
        
        # Allow more segments (some APIs have deep paths)
        segments = [s for s in path.split('/') if s]
        if len(segments) > 10:  # Increased from 6
            return False
        
        # Allow more parameters
        param_count = path.count('{')
        if param_count > 3:  # Increased from 2
            return False
        
        return True

    def validate_endpoint_context(self, context: str, method: str, path: str) -> bool:
        """More lenient context validation"""
        context_lower = context.lower()
        
        # Strong negative indicators (definite false positives)
        strong_negatives = [
            'example of how', 'for example, you might', 'such as this',
            'this is just an example', 'placeholder'
        ]
        
        has_strong_negative = any(neg in context_lower for neg in strong_negatives)
        if has_strong_negative:
            return False
        
        # If we find the exact method + path pattern, it's likely valid
        endpoint_pattern = f"{method.lower()}.*{re.escape(path)}"
        if re.search(endpoint_pattern, context_lower):
            return True
        
        # Look for API-related context
        api_indicators = [
            'endpoint', 'api', 'request', 'response', 'curl', 'http',
            'parameter', 'header', 'body', 'json', 'returns', 'creates'
        ]
        
        has_api_context = any(indicator in context_lower for indicator in api_indicators)
        
        # Be more lenient - accept if it has any API context
        return has_api_context

    def final_endpoint_validation(self, endpoint: Dict[str, Any]) -> bool:
        """More balanced final validation"""
        path = endpoint.get('path', '')
        method = endpoint.get('method', '')
        context = endpoint.get('context', '')
        
        # Must have basic components
        if not path or not method:
            return False
        
        # Check path structure with more lenient rules
        if not self.is_valid_endpoint_path(path):
            return False
        
        # Only reject obvious false positive patterns
        false_positive_patterns = [
            r'all-[\w-]+-get$',  # Clear method suffix patterns
            r'[\w-]+-post$',
            r'[\w-]+-put$',
            r'[\w-]+-patch$',
            r'[\w-]+-delete$',
            r'/of-[a-z-]+-for-[a-z-]+',  # Descriptive text patterns
            r'/and-[a-z-]+-[a-z-]+',
        ]
        
        for pattern in false_positive_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                return False
        
        # More lenient context validation
        return self.validate_endpoint_context(context, method, path)

    def calculate_endpoint_confidence(self, endpoint_group: List[Dict[str, Any]]) -> float:
        """More generous confidence calculation"""
        confidence = 0.0
        
        # Base confidence for finding the endpoint
        confidence += 0.4  # Increased from 0.3
        
        # Bonus for multiple sources
        sources = set()
        for ep in endpoint_group:
            sources.add(ep.get('source', 'unknown'))
        
        if len(sources) > 1:
            confidence += 0.2
        
        # Bonus for good context
        all_context = ' '.join([ep.get('context', '') for ep in endpoint_group])
        context_lower = all_context.lower()
        
        # Strong positive indicators
        strong_indicators = ['curl', 'authorization', 'response', 'request body', 'parameters', 'returns']
        for indicator in strong_indicators:
            if indicator in context_lower:
                confidence += 0.15  # Increased bonus
        
        # Smaller penalty for weak negative indicators
        weak_negatives = ['example', 'documentation']
        for indicator in weak_negatives:
            if indicator in context_lower:
                confidence -= 0.1  # Reduced penalty
        
        return min(1.0, max(0.0, confidence))
    
    def extract_all_endpoints_comprehensive(self) -> List[Dict[str, Any]]:
        """More balanced endpoint extraction"""
        print("Extracting endpoints with balanced detection...")
        
        endpoints = []
        
        # Strategy 1: Pattern-based extraction (primary)
        endpoints.extend(self.extract_endpoints_from_patterns())
        
        # Strategy 2: Section-based extraction (more lenient)
        endpoints.extend(self.extract_endpoints_from_sections())
        
        # Deduplicate and enhance with balanced validation
        unique_endpoints = self.deduplicate_and_enhance_endpoints(endpoints)
        
        # More lenient confidence filtering
        filtered_endpoints = [ep for ep in unique_endpoints if ep.get('confidence', 0) > 0.3]
        
        print(f"Found {len(filtered_endpoints)} endpoints after balanced filtering")
        return filtered_endpoints
    
    def extract_endpoints_from_patterns(self) -> List[Dict[str, Any]]:
        """More comprehensive pattern matching"""
        endpoints = []
        
        # Expanded pattern list to catch more valid endpoints
        comprehensive_patterns = [
            # Standard format: METHOD /path
            r'\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(/[\w\-/{}.:\[\]]+)',
            # Reverse format: /path METHOD
            r'(/[\w\-/{}.:\[\]]+)\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b',
            # In code blocks
            r'```[^`]*\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(/[\w\-/{}.:\[\]]+)',
            # With quotes
            r'"(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(/[\w\-/{}.:\[\]]+)"',
            # HTTP method on separate line followed by path
            r'\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\n\s*(/[\w\-/{}.:\[\]]+)',
            # In API documentation tables
            r'\|\s*(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\|\s*(/[\w\-/{}.:\[\]]+)',
            # With colons (common in docs)
            r'(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS):\s*(/[\w\-/{}.:\[\]]+)',
        ]
        
        for pattern in comprehensive_patterns:
            matches = re.finditer(pattern, self.clean_text, re.MULTILINE | re.IGNORECASE)
            
            for match in matches:
                groups = match.groups()
                
                # Determine method and path from groups
                method, path = None, None
                
                for group in groups:
                    if group and group.upper() in self.http_methods:
                        method = group.upper()
                    elif group and group.startswith('/'):
                        path = group
                
                if method and path and self.is_valid_endpoint_path(path):
                    context_start = max(0, match.start() - 200)
                    context_end = min(len(self.clean_text), match.end() + 200)
                    context = self.clean_text[context_start:context_end]
                    
                    # Use more lenient context validation
                    if self.validate_endpoint_context(context, method, path):
                        endpoints.append({
                            'method': method,
                            'path': path.rstrip('.,;'),  # Clean trailing punctuation
                            'context': context,
                            'source': 'pattern_matching'
                        })
        
        return endpoints
    
    def extract_endpoints_from_sections(self) -> List[Dict[str, Any]]:
        """More comprehensive section-based extraction - corrected version"""
        endpoints = []
        
        if not self.sections_data:
            return endpoints
        
        for i, section in enumerate(self.sections_data):
            title = section.get('text', '').strip()
            level = section.get('level', 1)
            has_endpoints = section.get('hasEndpoints', False)
            has_code = section.get('hasCodeExamples', False)
            
            # More inclusive criteria for checking sections
            should_check_section = (
                has_endpoints or 
                has_code or 
                self.section_suggests_endpoint_strict(title) or
                level <= 3  # Include more heading levels
            )
            
            if should_check_section:
                # Try to extract from title first
                method, path = self.extract_method_path_from_title(title)
                
                if method and path:
                    section_content = self.get_section_content_from_text(title, i)
                    
                    endpoints.append({
                        'method': method,
                        'path': path,
                        'context': section_content,
                        'source': 'section_analysis',
                        'section_title': title,
                        'section_level': level
                    })
                else:
                    # If title doesn't contain endpoint, look in section content
                    section_content = self.get_section_content_from_text(title, i)
                    if section_content and len(section_content.strip()) > 50:
                        # Use the same pattern matching logic as extract_endpoints_from_patterns
                        # but apply it to the section content
                        content_endpoints = self.extract_endpoints_from_text_content(
                            section_content, title, level
                        )
                        endpoints.extend(content_endpoints)
        
        return endpoints

    def extract_endpoints_from_text_content(self, content: str, section_title: str, section_level: int) -> List[Dict[str, Any]]:
        """Extract endpoints from a specific text content block"""
        endpoints = []
        
        # Use same patterns as main pattern matching but on section content
        patterns = [
            r'\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(/[\w\-/{}.:\[\]]+)',
            r'(/[\w\-/{}.:\[\]]+)\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b',
            r'(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS):\s*(/[\w\-/{}.:\[\]]+)',
            r'\|\s*(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\|\s*(/[\w\-/{}.:\[\]]+)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE)
            
            for match in matches:
                groups = match.groups()
                method, path = None, None
                
                for group in groups:
                    if group and group.upper() in self.http_methods:
                        method = group.upper()
                    elif group and group.startswith('/'):
                        path = group
                
                if method and path and self.is_valid_endpoint_path(path):
                    # Create context from surrounding content
                    match_start = max(0, match.start() - 100)
                    match_end = min(len(content), match.end() + 100)
                    context = content[match_start:match_end]
                    
                    if self.validate_endpoint_context(context, method, path):
                        endpoints.append({
                            'method': method,
                            'path': path.rstrip('.,;'),
                            'context': content,  # Use full section content as context
                            'source': 'section_content',
                            'section_title': section_title,
                            'section_level': section_level
                        })
        
        return endpoints
    
    def section_suggests_endpoint_strict(self, title: str) -> bool:
        """More lenient section endpoint detection"""
        title_lower = title.lower()
        
        # Direct endpoint indicators
        if any(method.lower() in title_lower for method in self.http_methods):
            return True
        
        # Path-like indicators
        if title.startswith('/'):
            return True
        
        # Operation indicators (more lenient)
        operation_indicators = [
            'create', 'update', 'delete', 'get', 'list', 'retrieve',
            'endpoint', 'api', 'request'
        ]
        
        return any(word in title_lower for word in operation_indicators)
    
    def extract_method_path_from_title(self, title: str) -> Tuple[Optional[str], Optional[str]]:
        """More comprehensive title-based extraction"""
        
        # Direct pattern matching first
        direct_patterns = [
            r'\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(/[\w\-/{}.:\[\]]+)',
            r'(/[\w\-/{}.:\[\]]+)\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b',
            r'(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS):\s*(/[\w\-/{}.:\[\]]+)',
        ]
        
        for pattern in direct_patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                groups = match.groups()
                method, path = None, None
                
                for group in groups:
                    if group and group.upper() in self.http_methods:
                        method = group.upper()
                    elif group and group.startswith('/'):
                        path = group
                
                if method and path and self.is_valid_endpoint_path(path):
                    return method, path
        
        # Look for just paths in section titles (common pattern)
        path_pattern = r'(/[\w\-/{}.:\[\]]{3,})'
        path_match = re.search(path_pattern, title)
        
        if path_match:
            path = path_match.group(1)
            if self.is_valid_endpoint_path(path):
                # Infer method from context or use GET as default
                title_lower = title.lower()
                if any(word in title_lower for word in ['create', 'add', 'new', 'post']):
                    return 'POST', path
                elif any(word in title_lower for word in ['update', 'modify', 'patch']):
                    return 'PATCH', path
                elif any(word in title_lower for word in ['delete', 'remove']):
                    return 'DELETE', path
                else:
                    return 'GET', path  # Default to GET
        
        return None, None
    
    def get_section_content_from_text(self, title: str, section_index: int) -> str:
        """Extract section content from clean text"""
        # Find the section in text by title
        lines = self.clean_text.split('\n')
        
        # Look for title or similar
        start_line = None
        for i, line in enumerate(lines):
            if title.lower() in line.lower() and len(line.strip()) < 200:
                start_line = i
                break
        
        if start_line is None:
            return ""
        
        # Extract content until next heading or section
        content_lines = []
        for i in range(start_line + 1, min(len(lines), start_line + 50)):
            line = lines[i].strip()
            
            # Stop at obvious section breaks
            if (line and 
                (line.isupper() and len(line) < 50) or
                (line.endswith(':') and len(line) < 50 and line.count(' ') < 3)):
                break
            
            content_lines.append(line)
        
        return '\n'.join(content_lines)
    
    def deduplicate_and_enhance_endpoints(self, endpoints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate endpoints and enhance with additional information - stricter validation"""
        # Group by method + path
        endpoint_groups = {}
        
        for endpoint in endpoints:
            # Additional validation before grouping
            if not self.final_endpoint_validation(endpoint):
                continue
                
            key = f"{endpoint['method']} {endpoint['path']}"
            if key not in endpoint_groups:
                endpoint_groups[key] = []
            endpoint_groups[key].append(endpoint)
        
        # Merge information from duplicates
        unique_endpoints = []
        
        for key, group in endpoint_groups.items():
            # Take the most complete endpoint as base
            base_endpoint = max(group, key=lambda x: len(x.get('context', '')))
            
            # Only include if we have high confidence
            confidence = self.calculate_endpoint_confidence(group)
            if confidence > 0.5:  # Reduced threshold slightly for balance
                # Enhance with information from other sources
                all_context = []
                all_sources = []
                
                for ep in group:
                    if ep.get('context'):
                        all_context.append(ep['context'])
                    if ep.get('source'):
                        all_sources.append(ep['source'])
                
                # Create enhanced endpoint
                enhanced = {
                    'id': self.generate_endpoint_id(base_endpoint['method'], base_endpoint['path']),
                    'name': self.generate_endpoint_name(base_endpoint),
                    'method': base_endpoint['method'],
                    'path': base_endpoint['path'],
                    'section_hierarchy': self.build_hierarchy_for_endpoint(base_endpoint),
                    'description': self.extract_description_from_context(all_context),
                    'parameters': self.extract_parameters_from_context(all_context, base_endpoint['method']),
                    'responses': self.extract_responses_from_context(all_context),
                    'business_rules': self.extract_business_rules_from_context(all_context),
                    'validation_rules': self.extract_validation_rules_from_context(all_context),
                    'code_examples': self.extract_code_examples_from_context(all_context),
                    'related_objects': self.extract_related_objects_from_context(all_context),
                    'sources': list(set(all_sources)),
                    'confidence': confidence
                }
                
                unique_endpoints.append(enhanced)
        
        return unique_endpoints
    
    def generate_endpoint_id(self, method: str, path: str) -> str:
        """Generate unique endpoint ID"""
        clean_path = re.sub(r'[^a-zA-Z0-9_]', '_', path.lower())
        clean_path = re.sub(r'_+', '_', clean_path).strip('_')
        return f"{method.lower()}_{clean_path}"[:60]
    
    def generate_endpoint_name(self, endpoint: Dict[str, Any]) -> str:
        """Generate human-readable endpoint name"""
        method = endpoint['method']
        path = endpoint['path']
        
        # Try to get from section title first
        if endpoint.get('section_title'):
            title = endpoint['section_title']
            if not any(word in title.lower() for word in ['parameter', 'response', 'example']):
                return title
        
        # Generate from method and path
        path_parts = [part for part in path.split('/') if part and not part.startswith('{')]
        
        if path_parts:
            resource = path_parts[-1].replace('_', ' ').replace('-', ' ').title()
            
            if method == 'GET':
                if '{' in path:
                    return f"Get {resource}"
                else:
                    return f"List {resource}"
            elif method == 'POST':
                return f"Create {resource}"
            elif method == 'PUT':
                return f"Update {resource}"
            elif method == 'PATCH':
                return f"Update {resource}"
            elif method == 'DELETE':
                return f"Delete {resource}"
        
        return f"{method.title()} {path}"
    
    def build_hierarchy_for_endpoint(self, endpoint: Dict[str, Any]) -> List[str]:
        """Build section hierarchy for endpoint"""
        hierarchy = []
        
        # Use section title if available
        if endpoint.get('section_title'):
            hierarchy.append(endpoint['section_title'])
        
        # Add path-based hierarchy
        path_parts = [part for part in endpoint['path'].split('/') if part and not part.startswith('{')]
        
        if path_parts:
            hierarchy.extend([part.replace('-', ' ').replace('_', ' ').title() for part in path_parts])
        
        return hierarchy[:5]  # Limit hierarchy depth
    
    def extract_description_from_context(self, contexts: List[str]) -> str:
        """Extract endpoint description from context"""
        all_text = ' '.join(contexts)
        
        # Look for descriptive sentences
        sentences = re.split(r'[.!?]+', all_text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            
            # Look for sentences that describe what the endpoint does
            if (len(sentence) > 20 and len(sentence) < 200 and
                not sentence.startswith('{') and
                not any(keyword in sentence.lower() for keyword in ['curl', 'http', 'example', 'parameter'])):
                
                # Clean up the sentence
                sentence = re.sub(r'\s+', ' ', sentence)
                return sentence
        
        return "API endpoint"  # Fallback
    
    def extract_parameters_from_context(self, contexts: List[str], method: str) -> Dict[str, Dict[str, Any]]:
        """Extract parameters from context with improved detection"""
        parameters = {
            "path": {},
            "query": {},
            "body": {},
            "headers": {}
        }
        
        all_text = ' '.join(contexts)
        
        # Look for parameter sections with better patterns
        param_section_patterns = [
            (r'(?:Path\s+)?Parameters?:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)', 'path'),
            (r'Request\s+Body:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)', 'body'),
            (r'Query\s+Parameters?:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)', 'query'),
            (r'Headers?:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)', 'headers'),
            (r'Body\s+Parameters?:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)', 'body'),
        ]
        
        for pattern, param_type in param_section_patterns:
            matches = re.finditer(pattern, all_text, re.MULTILINE | re.IGNORECASE | re.DOTALL)
            
            for match in matches:
                param_text = match.group(1)
                extracted_params = self.parse_parameter_text_improved(param_text)
                parameters[param_type].update(extracted_params)
        
        # Look for path parameters in the path itself
        if '{' in method or any('{' in ctx for ctx in contexts):
            path_params = re.findall(r'\{([^}]+)\}', all_text)
            for param in path_params:
                if param not in parameters['path']:
                    parameters['path'][param] = {
                        "type": "string",
                        "description": f"Path parameter: {param}",
                        "required": True,
                        "validation": "",
                        "example": ""
                    }
        
        return parameters
    
    def parse_parameter_text_improved(self, param_text: str) -> Dict[str, Any]:
        """Improved parameter text parsing"""
        params = {}
        
        # Multiple parameter patterns
        patterns = [
            # name (type) - description
            r'(\w+)\s*\(([^)]+)\)\s*[-:]?\s*(.+?)(?=\n\w+\s*\(|\n\n|$)',
            # name: type - description
            r'(\w+):\s*([a-zA-Z]+)\s*[-:]?\s*(.+?)(?=\n\w+:|\n\n|$)',
            # - name (type): description
            r'-\s*(\w+)\s*\(([^)]+)\):\s*(.+?)(?=\n-|\n\n|$)',
            # name | type | description (table format)
            r'(\w+)\s*\|\s*([^|]+)\s*\|\s*(.+?)(?=\n\w+\s*\||\n\n|$)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, param_text, re.MULTILINE | re.DOTALL)
            
            for match in matches:
                param_name = match.group(1).strip()
                param_type = match.group(2).strip()
                description = match.group(3).strip()
                
                # Skip if already found
                if param_name in params:
                    continue
                
                # Determine if required
                required = any(keyword in description.lower() 
                             for keyword in ['required', 'mandatory', 'must be provided'])
                
                # Extract validation
                validation = ""
                if any(keyword in description.lower() 
                      for keyword in ['format', 'pattern', 'must be', 'valid']):
                    validation = description
                
                # Extract example
                example = ""
                example_match = re.search(r'example:?\s*([^\n.]+)', description, re.IGNORECASE)
                if example_match:
                    example = example_match.group(1).strip()
                
                params[param_name] = {
                    "type": param_type,
                    "description": description,
                    "required": required,
                    "validation": validation,
                    "example": example
                }
        
        return params
    
    def extract_responses_from_context(self, contexts: List[str]) -> Dict[str, Any]:
        """Extract response information from context"""
        responses = {}
        all_text = ' '.join(contexts)
        
        # Look for response sections
        response_patterns = [
            r'Response:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)',
            r'Returns?:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)',
            r'Success\s+Response:?\s*\n(.*?)(?:\n\n|\n[A-Z]|$)',
        ]
        
        for pattern in response_patterns:
            matches = re.finditer(pattern, all_text, re.MULTILINE | re.IGNORECASE | re.DOTALL)
            
            for match in matches:
                response_text = match.group(1)
                
                # Look for status codes
                status_matches = re.finditer(r'(\d{3})\s*[-:]?\s*(.+?)(?=\n\d{3}|\n\n|$)', 
                                           response_text, re.MULTILINE)
                
                for status_match in status_matches:
                    status_code = status_match.group(1)
                    description = status_match.group(2).strip()
                    
                    if status_code.startswith('2'):
                        responses[status_code] = {
                            "description": description,
                            "schema": "object",
                            "example": self.extract_json_example_from_text(response_text)
                        }
                    else:
                        if "error_codes" not in responses:
                            responses["error_codes"] = {}
                        responses["error_codes"][status_code] = description
        
        # Default response if none found
        if not any(k.startswith('2') for k in responses.keys() if k != "error_codes"):
            responses["200"] = {
                "description": "Successful response",
                "schema": "object",
                "example": ""
            }
        
        return responses
    
    def extract_json_example_from_text(self, text: str) -> str:
        """Extract JSON example from text"""
        json_matches = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text)
        
        if json_matches:
            # Return the largest JSON object
            return max(json_matches, key=len)
        
        return ""
    
    def extract_business_rules_from_context(self, contexts: List[str]) -> List[str]:
        """Extract business rules from context"""
        rules = []
        all_text = ' '.join(contexts)
        
        # Improved business rule patterns
        rule_patterns = [
            r'(?:must|should|will|cannot|may not|required to|need to)\s+([^.!?]+)[.!?]',
            r'(?:when|if)\s+([^,]+),\s*(?:then\s+)?([^.!?]+)[.!?]',
            r'(?:only|unless)\s+([^.!?]+)[.!?]',
            r'(?:entities|accounts|transfers|loans)\s+(?:must|should|will|cannot)\s+([^.!?]+)[.!?]',
            r'(?:before|after)\s+([^,]+),\s*([^.!?]+)[.!?]'
        ]
        
        for pattern in rule_patterns:
            matches = re.finditer(pattern, all_text, re.IGNORECASE)
            for match in matches:
                rule_text = match.group(0).strip()
                if len(rule_text) > 15 and len(rule_text) < 300:
                    # Clean up the rule
                    rule_text = re.sub(r'\s+', ' ', rule_text)
                    if rule_text not in rules:
                        rules.append(rule_text)
        
        return rules[:10]  # Limit to most relevant rules
    
    def extract_validation_rules_from_context(self, contexts: List[str]) -> List[str]:
        """Extract validation rules from context"""
        validations = []
        all_text = ' '.join(contexts)
        
        validation_patterns = [
            r'(?:format|pattern|must be|should be)\s+([^.!?]+)[.!?]',
            r'(?:minimum|maximum|length|size)\s+(?:of\s+)?([^.!?]+)[.!?]',
            r'(?:valid|invalid|allowed|forbidden|accepted|rejected)\s+([^.!?]+)[.!?]',
            r'(?:between|from)\s+\d+\s+(?:and|to)\s+\d+\s+([^.!?]+)[.!?]',
            r'(?:regex|regexp|regular expression):\s*([^\s]+)'
        ]
        
        for pattern in validation_patterns:
            matches = re.finditer(pattern, all_text, re.IGNORECASE)
            for match in matches:
                validation_text = match.group(0).strip()
                if len(validation_text) > 10 and len(validation_text) < 200:
                    validation_text = re.sub(r'\s+', ' ', validation_text)
                    if validation_text not in validations:
                        validations.append(validation_text)
        
        return validations[:8]
    
    def extract_code_examples_from_context(self, contexts: List[str]) -> Dict[str, str]:
        """Enhanced code example extraction"""
        examples = {}
        all_text = ' '.join(contexts)
        
        # Extract examples by language
        for lang, patterns in self.code_patterns.items():
            for pattern in patterns:
                matches = re.findall(pattern, all_text, re.MULTILINE | re.DOTALL)
                
                if matches:
                    # Take the longest/most complete example
                    best_match = max(matches, key=len)
                    
                    # Clean up the example
                    if lang == 'json':
                        # Keep only valid JSON-like structure
                        if best_match.strip().startswith('{') and len(best_match) > 20:
                            examples[lang] = best_match.strip()
                    elif lang == 'curl':
                        # Clean curl commands
                        cleaned = re.sub(r'\s+', ' ', best_match.strip())
                        if 'curl' in cleaned.lower() and len(cleaned) > 15:
                            examples[lang] = cleaned
                    else:
                        examples[lang] = best_match.strip()
        
        return examples
    
    def extract_related_objects_from_context(self, contexts: List[str]) -> List[str]:
        """Extract related data model references"""
        objects = set()
        all_text = ' '.join(contexts)
        
        # Look for object references
        object_patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+object',
            r'(?:returns?|creates?|updates?)\s+(?:a|an)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'(?:see|refer to|reference)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:entity|model|resource)',
            r'(?:type|kind|instance)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
        ]
        
        for pattern in object_patterns:
            matches = re.findall(pattern, all_text)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                
                clean_match = match.strip()
                if (len(clean_match) > 1 and len(clean_match) < 50 and
                    not any(word in clean_match.lower() 
                           for word in ['response', 'request', 'error', 'example', 'parameter'])):
                    objects.add(clean_match)
        
        return list(objects)[:8]
    
    def extract_authentication_comprehensive(self) -> Dict[str, Any]:
        """Comprehensive authentication extraction"""
        print("Extracting authentication with improved detection...")
        
        methods = []
        auth_text = self.clean_text.lower()
        
        for auth_type, patterns in self.auth_patterns.items():
            for pattern in patterns:
                if re.search(pattern, auth_text, re.IGNORECASE):
                    # Extract implementation details
                    implementation = self.extract_auth_implementation_improved(auth_type)
                    
                    method_info = {
                        "type": auth_type,
                        "description": f"{auth_type.replace('_', ' ').title()} authentication",
                        "implementation": implementation,
                        "scopes": self.extract_auth_scopes(auth_type) if auth_type == 'oauth' else [],
                        "examples": self.extract_auth_examples(auth_type)
                    }
                    
                    methods.append(method_info)
                    break  # Only add each type once
        
        print(f"Found {len(methods)} authentication methods: {[m['type'] for m in methods]}")
        return {"methods": methods}
    
    def extract_auth_implementation_improved(self, auth_type: str) -> str:
        """Extract detailed authentication implementation"""
        # Look for auth-specific sections
        auth_keywords = {
            'api_key': ['api key', 'authentication', 'x-api-key'],
            'bearer': ['bearer', 'authorization', 'token'],
            'oauth': ['oauth', 'client credentials', 'authorization code'],
            'basic': ['basic auth', 'username', 'password']
        }
        
        keywords = auth_keywords.get(auth_type, [auth_type])
        
        # Find relevant sections
        lines = self.clean_text.split('\n')
        relevant_lines = []
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in keywords):
                # Collect context around this line
                start = max(0, i - 3)
                end = min(len(lines), i + 8)
                context_lines = lines[start:end]
                
                # Filter for implementation details
                for ctx_line in context_lines:
                    ctx_lower = ctx_line.lower()
                    if (any(word in ctx_lower for word in ['header', 'include', 'send', 'provide', 'use']) and
                        len(ctx_line.strip()) > 10 and len(ctx_line.strip()) < 200):
                        relevant_lines.append(ctx_line.strip())
        
        if relevant_lines:
            return ' '.join(relevant_lines[:3])  # Take first 3 relevant lines
        
        return f"Use {auth_type.replace('_', ' ')} for authentication"
    
    def extract_auth_scopes(self, auth_type: str) -> List[str]:
        """Extract OAuth scopes"""
        if auth_type != 'oauth':
            return []
        
        scopes = []
        scope_patterns = [
            r'scope[s]?:?\s*([^\n]+)',
            r'permission[s]?:?\s*([^\n]+)',
            r'access\s+to:?\s*([^\n]+)'
        ]
        
        for pattern in scope_patterns:
            matches = re.findall(pattern, self.clean_text, re.IGNORECASE)
            for match in matches:
                scope_list = re.split(r'[,;|\s]+', match)
                scopes.extend([scope.strip() for scope in scope_list if scope.strip()])
        
        return scopes[:10]
    
    def extract_auth_examples(self, auth_type: str) -> List[str]:
        """Extract authentication examples"""
        examples = []
        
        # Look for auth-related code examples
        auth_code_patterns = {
            'api_key': [r'x-api-key:\s*[^\n]+', r'Authorization:\s*[^\n]+'],
            'bearer': [r'Authorization:\s*Bearer\s+[^\n]+', r'bearer\s+[a-zA-Z0-9_-]+'],
            'oauth': [r'client_id[^\n]+', r'access_token[^\n]+'],
            'basic': [r'Authorization:\s*Basic\s+[^\n]+', r'username.*password']
        }
        
        patterns = auth_code_patterns.get(auth_type, [])
        
        for pattern in patterns:
            matches = re.findall(pattern, self.clean_text, re.IGNORECASE)
            examples.extend(matches[:2])  # Limit examples
        
        return examples
    
    def extract_data_models_comprehensive(self) -> Dict[str, Any]:
        """Comprehensive data model extraction"""
        print("Extracting data models with improved detection...")
        
        models = {}
        
        # Strategy 1: Section-based extraction
        if self.sections_data:
            for section in self.sections_data:
                title = section.get('text', '').strip()
                if self.is_model_section(title):
                    model_name = self.extract_model_name_improved(title)
                    section_content = self.get_section_content_from_text(title, 0)
                    
                    if model_name and section_content:
                        model_data = self.extract_model_details_improved(section_content, model_name, title)
                        if model_data:
                            models[model_name] = model_data
        
        # Strategy 2: Pattern-based extraction from text
        additional_models = self.extract_models_from_text_patterns()
        models.update(additional_models)
        
        print(f"Found {len(models)} data models")
        return models
    
    def is_model_section(self, title: str) -> bool:
        """Enhanced model section detection"""
        title_lower = title.lower()
        
        # Direct object indicators
        if (title.endswith(' object') or title.endswith(' Object') or
            title.endswith(' entity') or title.endswith(' Entity')):
            return True
        
        # Parameter/property sections
        if ('parameters' in title_lower or 'properties' in title_lower or
            'fields' in title_lower or 'attributes' in title_lower):
            return True
        
        # Schema/model indicators
        if any(word in title_lower for word in ['schema', 'model', 'structure', 'format']):
            return True
        
        return False
    
    def extract_model_name_improved(self, title: str) -> str:
        """Improved model name extraction"""
        # Remove common suffixes
        clean_title = title
        suffixes = [' object', ' Object', ' entity', ' Entity', ' parameters', ' Parameters',
                   ' schema', ' Schema', ' model', ' Model']
        
        for suffix in suffixes:
            if clean_title.endswith(suffix):
                clean_title = clean_title[:-len(suffix)]
                break
        
        # Clean and convert to PascalCase
        words = re.split(r'[^\w]+', clean_title)
        words = [word.capitalize() for word in words if word]
        
        model_name = ''.join(words)
        
        # Ensure it's a valid identifier
        if not model_name or not model_name[0].isalpha():
            return "UnknownModel"
        
        return model_name
    
    def extract_model_details_improved(self, content: str, model_name: str, title: str) -> Dict[str, Any]:
        """Enhanced model detail extraction"""
        # Extract description
        lines = content.split('\n')
        description_lines = []
        
        for line in lines[:5]:  # Check first few lines
            line = line.strip()
            if (len(line) > 20 and len(line) < 300 and
                not line.startswith('{') and
                '|' not in line and  # Skip table headers
                not line.isupper()):
                description_lines.append(line)
        
        description = ' '.join(description_lines) if description_lines else f"Data model for {model_name}"
        
        # Extract properties
        properties = self.extract_model_properties_improved(content)
        
        # Extract relationships
        relationships = self.extract_model_relationships_improved(content)
        
        # Extract example
        example = self.extract_json_example_from_text(content)
        
        return {
            "description": description[:500],  # Limit description length
            "type": "object",
            "properties": properties,
            "relationships": relationships,
            "example": example
        }
    
    def extract_model_properties_improved(self, content: str) -> Dict[str, Any]:
        """Enhanced property extraction with multiple formats"""
        properties = {}
        
        # Strategy 1: Table format
        table_properties = self.extract_properties_from_table(content)
        properties.update(table_properties)
        
        # Strategy 2: List format
        list_properties = self.extract_properties_from_list(content)
        properties.update(list_properties)
        
        # Strategy 3: JSON schema format
        json_properties = self.extract_properties_from_json(content)
        properties.update(json_properties)
        
        return properties
    
    def extract_properties_from_table(self, content: str) -> Dict[str, Any]:
        """Extract properties from table format"""
        properties = {}
        
        # Look for table-like structures
        lines = content.split('\n')
        
        # Find header line
        header_line = None
        header_index = None
        
        for i, line in enumerate(lines):
            if '|' in line and any(word in line.lower() for word in ['name', 'type', 'description']):
                header_line = line
                header_index = i
                break
        
        if not header_line:
            return properties
        
        # Parse header
        headers = [h.strip() for h in header_line.split('|') if h.strip()]
        
        # Find column indices
        name_col = None
        type_col = None
        desc_col = None
        req_col = None
        
        for j, header in enumerate(headers):
            header_lower = header.lower()
            if 'name' in header_lower or 'field' in header_lower:
                name_col = j
            elif 'type' in header_lower:
                type_col = j
            elif 'description' in header_lower or 'desc' in header_lower:
                desc_col = j
            elif 'required' in header_lower or 'req' in header_lower:
                req_col = j
        
        if name_col is None:
            return properties
        
        # Parse data rows
        for i in range(header_index + 1, min(len(lines), header_index + 50)):
            line = lines[i].strip()
            
            if not line or not '|' in line:
                continue
            
            # Skip separator lines
            if re.match(r'^[\s|:-]+$', line):
                continue
            
            cells = [cell.strip() for cell in line.split('|') if cell.strip()]
            
            if len(cells) <= name_col:
                continue
            
            prop_name = cells[name_col]
            if not prop_name or not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', prop_name):
                continue
            
            prop_type = cells[type_col] if type_col and len(cells) > type_col else "string"
            description = cells[desc_col] if desc_col and len(cells) > desc_col else ""
            required = False
            
            if req_col and len(cells) > req_col:
                req_value = cells[req_col].lower()
                required = any(word in req_value for word in ['yes', 'true', 'required'])
            
            properties[prop_name] = {
                "type": prop_type.lower(),
                "description": description,
                "required": required,
                "validation": "",
                "business_rules": [],
                "example": ""
            }
        
        return properties
    
    def extract_properties_from_list(self, content: str) -> Dict[str, Any]:
        """Extract properties from list format"""
        properties = {}
        
        # Look for property definitions in list format
        prop_patterns = [
            r'[-*]\s*(\w+)\s*\(([^)]+)\)\s*[-:]?\s*(.+?)(?=\n[-*]|\n\n|$)',
            r'(\w+):\s*([a-zA-Z]+)\s*[-:]?\s*(.+?)(?=\n\w+:|\n\n|$)',
            r'(\w+)\s*\|\s*([^|]+)\s*\|\s*(.+?)(?=\n\w+\s*\||\n\n|$)'
        ]
        
        for pattern in prop_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
            
            for match in matches:
                prop_name = match.group(1).strip()
                prop_type = match.group(2).strip()
                description = match.group(3).strip()
                
                if prop_name and re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', prop_name):
                    required = any(word in description.lower() for word in ['required', 'mandatory'])
                    
                    properties[prop_name] = {
                        "type": prop_type.lower(),
                        "description": description,
                        "required": required,
                        "validation": "",
                        "business_rules": [],
                        "example": ""
                    }
        
        return properties
    
    def extract_properties_from_json(self, content: str) -> Dict[str, Any]:
        """Extract properties from JSON schema examples"""
        properties = {}
        
        # Look for JSON objects
        json_matches = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content)
        
        for json_text in json_matches:
            try:
                import json as json_module
                
                # Clean the JSON text
                cleaned_json = re.sub(r'//.*', '', json_text)  # Remove comments
                cleaned_json = re.sub(r',\s*}', '}', cleaned_json)  # Remove trailing commas
                
                try:
                    parsed = json_module.loads(cleaned_json)
                    if isinstance(parsed, dict):
                        for key, value in parsed.items():
                            if isinstance(key, str) and re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', key):
                                # Infer type from value
                                if isinstance(value, str):
                                    prop_type = "string"
                                elif isinstance(value, int):
                                    prop_type = "integer"
                                elif isinstance(value, float):
                                    prop_type = "number"
                                elif isinstance(value, bool):
                                    prop_type = "boolean"
                                elif isinstance(value, list):
                                    prop_type = "array"
                                elif isinstance(value, dict):
                                    prop_type = "object"
                                else:
                                    prop_type = "string"
                                
                                properties[key] = {
                                    "type": prop_type,
                                    "description": f"Property: {key}",
                                    "required": False,
                                    "validation": "",
                                    "business_rules": [],
                                    "example": str(value) if not isinstance(value, (dict, list)) else ""
                                }
                except:
                    continue  # Skip invalid JSON
                    
            except:
                continue
        
        return properties
    
    def extract_models_from_text_patterns(self) -> Dict[str, Any]:
        """Extract additional models using text patterns"""
        models = {}
        
        # Look for object definitions in text
        object_patterns = [
            r'([A-Z][a-zA-Z]+)\s+object[:\s]*\n(.*?)(?=\n[A-Z][a-zA-Z]+\s+object|\n\n[A-Z]|$)',
            r'## ([A-Z][a-zA-Z\s]+)\n(.*?)(?=\n##|\n\n[A-Z]|$)',
            r'### ([A-Z][a-zA-Z\s]+) Object\n(.*?)(?=\n###|\n\n[A-Z]|$)'
        ]
        
        for pattern in object_patterns:
            matches = re.finditer(pattern, self.clean_text, re.MULTILINE | re.DOTALL)
            
            for match in matches:
                title = match.group(1).strip()
                content = match.group(2).strip()
                
                if len(content) > 50:  # Must have substantial content
                    model_name = self.extract_model_name_improved(title)
                    model_data = self.extract_model_details_improved(content, model_name, title)
                    
                    if model_data and model_name not in models:
                        models[model_name] = model_data
        
        return models
    
    def extract_model_relationships_improved(self, content: str) -> List[str]:
        """Enhanced relationship extraction"""
        relationships = []
        
        rel_patterns = [
            r'(?:belongs\s+to|has\s+many|has\s+one|contains|references|includes)\s+([A-Z][a-zA-Z\s]+)',
            r'(?:related\s+to|linked\s+to|associated\s+with|connected\s+to)\s+([A-Z][a-zA-Z\s]+)',
            r'(?:parent|child|owner)\s+(?:of\s+)?([A-Z][a-zA-Z\s]+)',
            r'([A-Z][a-zA-Z\s]+)\s+(?:relationship|association|connection)'
        ]
        
        for pattern in rel_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                clean_match = match.strip()
                if len(clean_match) > 1 and clean_match not in relationships:
                    relationships.append(clean_match)
        
        return relationships[:5]
    
    def extract_provider_info(self) -> Dict[str, Any]:
        """Extract provider information"""
        provider_name = "unknown"
        source_url = ""
        
        if self.crawl_report:
            source_url = self.crawl_report.get('url', '')
            if source_url:
                domain = urlparse(source_url).netloc
                provider_name = domain.split('.')[0] if domain else "unknown"
        
        if provider_name == "unknown":
            dir_name = self.api_docs_dir.name
            if '_' in dir_name:
                provider_name = dir_name.split('_')[0]
        
        return {
            "provider": provider_name,
            "source_url": source_url,
            "extracted_at": datetime.now().isoformat()
        }
    
    def extract_api_overview_improved(self) -> Dict[str, Any]:
        """Improved API overview extraction"""
        # Get first section or intro content
        intro_text = ""
        if self.sections_data:
            for section in self.sections_data[:3]:
                title = section.get('text', '').lower()
                if any(keyword in title for keyword in ['introduction', 'overview', 'getting started', 'api']):
                    intro_text = self.get_section_content_from_text(section.get('text', ''), 0)
                    break
        
        if not intro_text:
            intro_text = self.clean_text[:1000]  # First 1000 chars as fallback
        
        # Extract key concepts with improved patterns
        key_concepts = []
        concept_patterns = [
            r'(?:manage|handle|create|process)\s+([a-z][a-z\s]+?)(?:\s|$|[.,])',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:API|api|entities|objects)',
            r'(?:work with|support for)\s+([a-z][a-z\s]+?)(?:\s|$|[.,])'
        ]
        
        for pattern in concept_patterns:
            matches = re.findall(pattern, intro_text, re.IGNORECASE)
            for match in matches:
                clean_match = match.strip().lower()
                if len(clean_match) > 2 and clean_match not in key_concepts:
                    key_concepts.append(clean_match)
        
        # Extract base URL
        base_url = ""
        url_pattern = r'https?://[a-zA-Z0-9\.-]+(?:/[a-zA-Z0-9\./]*)?'
        urls = re.findall(url_pattern, intro_text)
        if urls:
            base_url = min(urls, key=len)  # Shortest URL likely base
        
        return {
            "description": intro_text[:500] + "..." if len(intro_text) > 500 else intro_text,
            "authentication_methods": [method['type'] for method in self.extract_authentication_comprehensive()['methods']],
            "base_url": base_url,
            "key_concepts": key_concepts[:8]
        }
    
    def extract_webhooks_improved(self) -> List[Dict[str, Any]]:
        """Improved webhook extraction"""
        webhooks = []
        
        if self.sections_data:
            for section in self.sections_data:
                title = section.get('text', '').lower()
                if any(keyword in title for keyword in ['webhook', 'event', 'notification']):
                    content = self.get_section_content_from_text(section.get('text', ''), 0)
                    section_webhooks = self.extract_webhook_events_improved(content)
                    webhooks.extend(section_webhooks)
        
        return webhooks
    
    def extract_webhook_events_improved(self, text: str) -> List[Dict[str, Any]]:
        """Improved webhook event extraction"""
        events = []
        
        # Look for event patterns
        event_patterns = [
            r'([a-z_\.]+)\s*[-:]\s*(.+?)(?=\n[a-z_\.]+\s*[-:]|\n\n|$)',
            r'Event[:\s]*([^\n]+)\n(.+?)(?=Event:|\n\n|$)',
            r'([a-z_\.]+)\s+event[:\s]*(.+?)(?=\n[a-z_\.]+\s+event|\n\n|$)'
        ]
        
        for pattern in event_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE | re.DOTALL)
            
            for match in matches:
                event_type = match.group(1).strip()
                description = match.group(2).strip() if len(match.groups()) > 1 else ""
                
                if event_type and len(description) > 10:
                    # Extract payload info
                    payload_schema = "object"
                    example_payload = self.extract_json_example_from_text(description)
                    
                    events.append({
                        "event_type": event_type,
                        "description": description,
                        "payload_schema": payload_schema,
                        "example_payload": example_payload
                    })
        
        return events
    
    def extract_errors_improved(self) -> Dict[str, Any]:
        """Improved error extraction"""
        errors = {}
        
        if self.sections_data:
            for section in self.sections_data:
                title = section.get('text', '').lower()
                if any(keyword in title for keyword in ['error', 'status', 'code']):
                    content = self.get_section_content_from_text(section.get('text', ''), 0)
                    section_errors = self.extract_error_codes_improved(content)
                    errors.update(section_errors)
        
        return errors
    
    def extract_error_codes_improved(self, text: str) -> Dict[str, Any]:
        """Improved error code extraction"""
        errors = {}
        
        # Enhanced error pattern matching
        error_patterns = [
            r'(\d{3})\s*[-:]\s*(.+?)(?=\n\d{3}|\n\n|$)',
            r'Status\s+(\d{3})[:\s]*(.+?)(?=\nStatus|\n\n|$)',
            r'HTTP\s+(\d{3})[:\s]*(.+?)(?=\nHTTP|\n\n|$)',
            r'Error\s+(\d{3})[:\s]*(.+?)(?=\nError|\n\n|$)'
        ]
        
        for pattern in error_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
            
            for match in matches:
                code = match.group(1)
                description = match.group(2).strip()
                
                if len(description) > 5:
                    errors[code] = {
                        "description": description,
                        "typical_causes": self.extract_error_causes_improved(description),
                        "resolution": self.extract_error_resolution_improved(description)
                    }
        
        return errors
    
    def extract_error_causes_improved(self, description: str) -> List[str]:
        """Improved error cause extraction"""
        causes = []
        
        cause_patterns = [
            r'(?:caused\s+by|due\s+to|when|occurs\s+when)\s+(.+?)(?:[.!]|$)',
            r'(?:if|when)\s+(.+?)(?:[.!]|$)',
            r'(?:happens\s+when|triggered\s+by)\s+(.+?)(?:[.!]|$)'
        ]
        
        for pattern in cause_patterns:
            matches = re.findall(pattern, description, re.IGNORECASE)
            for match in matches:
                clean_cause = match.strip()
                if len(clean_cause) > 5 and len(clean_cause) < 150:
                    causes.append(clean_cause)
        
        return causes[:3]
    
    def extract_error_resolution_improved(self, description: str) -> str:
        """Improved error resolution extraction"""
        resolution_patterns = [
            r'(?:to\s+fix|resolve|solution|try)\s*:?\s*(.+?)(?:[.!]|$)',
            r'(?:should|ensure|check)\s+(.+?)(?:[.!]|$)',
            r'(?:verify|confirm)\s+(.+?)(?:[.!]|$)'
        ]
        
        for pattern in resolution_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def generate_semantic_map_improved(self) -> Dict[str, Any]:
        """Generate improved semantic map with comprehensive extraction"""
        print("Generating improved semantic map...")
        
        if not self.load_data():
            raise Exception("Failed to load data")
        
        # Extract provider info
        provider_info = self.extract_provider_info()
        
        # Extract with improved methods
        api_overview = self.extract_api_overview_improved()
        endpoints = self.extract_all_endpoints_comprehensive()
        data_models = self.extract_data_models_comprehensive()
        authentication = self.extract_authentication_comprehensive()
        webhooks = self.extract_webhooks_improved()
        errors = self.extract_errors_improved()
        
        # Build complete semantic map
        semantic_map = {
            **provider_info,
            "api_overview": api_overview,
            "endpoints": endpoints,
            "data_models": data_models,
            "authentication": authentication,
            "webhooks": webhooks,
            "errors": errors
        }
        
        return semantic_map
    
    def save_improved_semantic_map(self, output_path: Optional[str] = None) -> str:
        """Generate and save the improved semantic map"""
        semantic_map = self.generate_semantic_map_improved()
        
        if output_path is None:
            output_path = self.api_docs_dir / f"{semantic_map['provider']}_semantic_map_improved.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(semantic_map, f, indent=2, ensure_ascii=False)
        
        print(f"Improved semantic map saved to: {output_path}")
        
        # Print comprehensive summary
        print(f"\nIMPROVED SEMANTIC EXTRACTION SUMMARY:")
        print(f"  Provider: {semantic_map['provider']}")
        print(f"  Endpoints: {len(semantic_map['endpoints'])}")
        print(f"  Data Models: {len(semantic_map['data_models'])}")
        print(f"  Auth Methods: {len(semantic_map['authentication']['methods'])}")
        print(f"  Webhooks: {len(semantic_map['webhooks'])}")
        print(f"  Error Codes: {len(semantic_map['errors'])}")
        
        # Show endpoint breakdown by method
        method_counts = {}
        for endpoint in semantic_map['endpoints']:
            method = endpoint['method']
            method_counts[method] = method_counts.get(method, 0) + 1
        
        print(f"\nEndpoint Breakdown:")
        for method, count in sorted(method_counts.items()):
            print(f"  {method}: {count}")
        
        # Show data model breakdown
        if semantic_map['data_models']:
            print(f"\nData Models Found:")
            for model_name in list(semantic_map['data_models'].keys())[:10]:
                print(f"  • {model_name}")
            if len(semantic_map['data_models']) > 10:
                print(f"  ... and {len(semantic_map['data_models']) - 10} more")
        
        return str(output_path)


def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python improved_semantic_extractor.py <api_docs_directory> [output_file]")
        print("\nExamples:")
        print("  python improved_semantic_extractor.py column_com_api_docs")
        print("  python improved_semantic_extractor.py stripe_com_api_docs stripe_improved.json")
        sys.exit(1)
    
    api_docs_dir = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        extractor = ImprovedSemanticExtractor(api_docs_dir)
        output_path = extractor.save_improved_semantic_map(output_file)
        
        print(f"\nImproved semantic extraction completed!")
        print(f"Output file: {output_path}")
        print(f"\nNext steps:")
        print(f"  1. Run verification: python semantic_verifier.py {api_docs_dir} {output_path}")
        print(f"  2. Compare with original extraction results")
        print(f"  3. Use for cross-provider API analysis")
        
    except Exception as e:
        print(f"Error during improved extraction: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()