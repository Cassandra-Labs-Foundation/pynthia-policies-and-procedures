#!/usr/bin/env python3
"""
Semantic Map Verification Script
Verifies completeness and accuracy of semantic extraction against original crawler output
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple
from collections import Counter, defaultdict
import difflib

class SemanticMapVerifier:
    def __init__(self, api_docs_dir: str, semantic_map_path: str):
        self.api_docs_dir = Path(api_docs_dir)
        self.semantic_map_path = Path(semantic_map_path)
        
        # Original data
        self.sections_data = None
        self.clean_text = ""
        self.crawl_report = None
        
        # Semantic map
        self.semantic_map = None
        
        # Analysis results
        self.verification_results = {
            'completeness': {},
            'accuracy': {},
            'coverage': {},
            'missing': {},
            'issues': []
        }
        
        # Patterns for detection
        self.http_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
        self.endpoint_patterns = [
            r'(GET|POST|PUT|DELETE|PATCH)\s+([/\w\-{}.:]+)',
            r'(GET|POST|PUT|DELETE|PATCH)\s*\n\s*([/\w\-{}.:]+)',
            r'([/\w\-{}.:]+)\s+(GET|POST|PUT|DELETE|PATCH)',
        ]
    
    def load_all_data(self) -> bool:
        """Load all data files"""
        print("📊 Loading all data for verification...")
        
        # Load sections JSON
        sections_files = list(self.api_docs_dir.glob("*_sections.json"))
        if sections_files:
            with open(sections_files[0], 'r') as f:
                self.sections_data = json.load(f)
            print(f"✅ Loaded sections data")
        else:
            print("❌ No sections file found")
            return False
        
        # Load clean text
        text_files = list(self.api_docs_dir.glob("*_clean.txt"))
        if text_files:
            with open(text_files[0], 'r', encoding='utf-8') as f:
                self.clean_text = f.read()
            print(f"✅ Loaded clean text ({len(self.clean_text):,} chars)")
        else:
            print("❌ No clean text file found")
            return False
        
        # Load crawl report
        crawl_report_path = self.api_docs_dir / 'crawl_report.json'
        if crawl_report_path.exists():
            with open(crawl_report_path, 'r') as f:
                self.crawl_report = json.load(f)
            print(f"✅ Loaded crawl report")
        
        # Load semantic map
        if self.semantic_map_path.exists():
            with open(self.semantic_map_path, 'r') as f:
                self.semantic_map = json.load(f)
            print(f"✅ Loaded semantic map")
        else:
            print(f"❌ Semantic map not found: {self.semantic_map_path}")
            return False
        
        return True
    
    def verify_endpoint_completeness(self) -> Dict[str, Any]:
        """Verify that all endpoints were extracted"""
        print("\n🔗 Verifying endpoint completeness...")
        
        # Find all endpoints in original text
        original_endpoints = self.find_all_endpoints_in_text()
        
        # Get endpoints from semantic map
        semantic_endpoints = self.semantic_map.get('endpoints', [])
        
        # Create comparison sets
        original_set = set()
        for endpoint in original_endpoints:
            key = f"{endpoint['method']} {endpoint['path']}"
            original_set.add(key)
        
        semantic_set = set()
        for endpoint in semantic_endpoints:
            key = f"{endpoint['method']} {endpoint['path']}"
            semantic_set.add(key)
        
        # Find missing and extra endpoints
        missing_endpoints = original_set - semantic_set
        extra_endpoints = semantic_set - original_set
        
        # Calculate coverage
        total_original = len(original_set)
        total_semantic = len(semantic_set)
        matched = len(original_set & semantic_set)
        
        coverage_percentage = (matched / total_original * 100) if total_original > 0 else 0
        
        results = {
            'total_original': total_original,
            'total_semantic': total_semantic,
            'matched': matched,
            'coverage_percentage': coverage_percentage,
            'missing_endpoints': list(missing_endpoints),
            'extra_endpoints': list(extra_endpoints),
            'original_endpoints': [f"{ep['method']} {ep['path']}" for ep in original_endpoints],
            'semantic_endpoints': [f"{ep['method']} {ep['path']}" for ep in semantic_endpoints]
        }
        
        print(f"  📊 Original endpoints found: {total_original}")
        print(f"  📊 Semantic endpoints extracted: {total_semantic}")
        print(f"  📊 Matched endpoints: {matched}")
        print(f"  📊 Coverage: {coverage_percentage:.1f}%")
        
        if missing_endpoints:
            print(f"  ❌ Missing {len(missing_endpoints)} endpoints:")
            for endpoint in list(missing_endpoints)[:5]:
                print(f"    • {endpoint}")
            if len(missing_endpoints) > 5:
                print(f"    ... and {len(missing_endpoints) - 5} more")
        
        if extra_endpoints:
            print(f"  ⚠️  Found {len(extra_endpoints)} extra endpoints (may be false positives):")
            for endpoint in list(extra_endpoints)[:3]:
                print(f"    • {endpoint}")
        
        return results
    
    def find_all_endpoints_in_text(self) -> List[Dict[str, Any]]:
        """Find all possible endpoints in the original text"""
        endpoints = []
        
        # Use multiple patterns to catch different formats
        for pattern in self.endpoint_patterns:
            matches = re.finditer(pattern, self.clean_text, re.MULTILINE | re.IGNORECASE)
            
            for match in matches:
                if len(match.groups()) >= 2:
                    # Determine which group is method and which is path
                    group1, group2 = match.group(1), match.group(2)
                    
                    if group1.upper() in self.http_methods:
                        method, path = group1.upper(), group2
                    elif group2.upper() in self.http_methods:
                        method, path = group2.upper(), group1
                    else:
                        continue
                    
                    # Validate the path
                    if self.is_valid_api_path(path):
                        endpoints.append({
                            'method': method,
                            'path': path.strip(),
                            'context': self.get_endpoint_context(match.start(), match.end())
                        })
        
        # Deduplicate
        seen = set()
        unique_endpoints = []
        for endpoint in endpoints:
            key = f"{endpoint['method']} {endpoint['path']}"
            if key not in seen:
                seen.add(key)
                unique_endpoints.append(endpoint)
        
        return unique_endpoints
    
    def is_valid_api_path(self, path: str) -> bool:
        """Validate if a string looks like a valid API path"""
        if not path or not path.startswith('/'):
            return False
        
        # Must contain only valid URL characters
        if not re.match(r'^/[\w\-/{}.:]+$', path):
            return False
        
        # Skip obviously invalid paths
        invalid_indicators = [
            'http', 'https', 'www.', '.com', '.html', '.json',
            'example', 'test', 'sample', 'placeholder'
        ]
        
        if any(indicator in path.lower() for indicator in invalid_indicators):
            return False
        
        # Must have reasonable length
        if len(path) < 2 or len(path) > 100:
            return False
        
        return True
    
    def get_endpoint_context(self, start: int, end: int) -> str:
        """Get context around an endpoint match"""
        # Get 200 characters before and after
        context_start = max(0, start - 200)
        context_end = min(len(self.clean_text), end + 200)
        
        return self.clean_text[context_start:context_end].strip()
    
    def verify_section_coverage(self) -> Dict[str, Any]:
        """Verify that all important sections were processed"""
        print("\n📖 Verifying section coverage...")
        
        if not self.sections_data:
            return {'error': 'No sections data available'}
        
        # Analyze original sections
        original_sections = []
        endpoint_sections = []
        model_sections = []
        
        for section in self.sections_data:
            title = section.get('text', '').strip()
            level = section.get('level', 1)
            has_endpoints = section.get('hasEndpoints', False)
            has_code = section.get('hasCodeExamples', False)
            
            original_sections.append(title)
            
            if has_endpoints:
                endpoint_sections.append(title)
            
            if (title.lower().endswith('object') or 
                'object parameters' in title.lower() or
                level <= 2 and any(keyword in title.lower() 
                                 for keyword in ['entity', 'model', 'schema'])):
                model_sections.append(title)
        
        # Check coverage in semantic map
        semantic_hierarchies = []
        for endpoint in self.semantic_map.get('endpoints', []):
            hierarchy = endpoint.get('section_hierarchy', [])
            semantic_hierarchies.extend(hierarchy)
        
        # Find sections mentioned in semantic map
        covered_sections = set(semantic_hierarchies)
        all_sections = set(original_sections)
        missing_sections = all_sections - covered_sections
        
        coverage_percentage = (len(covered_sections) / len(all_sections) * 100) if all_sections else 0
        
        results = {
            'total_sections': len(all_sections),
            'covered_sections': len(covered_sections),
            'coverage_percentage': coverage_percentage,
            'endpoint_sections': len(endpoint_sections),
            'model_sections': len(model_sections),
            'missing_sections': list(missing_sections),
            'important_missing': []
        }
        
        # Identify important missing sections
        for section in missing_sections:
            if any(keyword in section.lower() for keyword in 
                  ['endpoint', 'api', 'create', 'update', 'delete', 'get', 'list', 'object']):
                results['important_missing'].append(section)
        
        print(f"  📊 Total sections: {len(all_sections)}")
        print(f"  📊 Covered sections: {len(covered_sections)}")
        print(f"  📊 Coverage: {coverage_percentage:.1f}%")
        print(f"  📊 Endpoint sections: {len(endpoint_sections)}")
        print(f"  📊 Model sections: {len(model_sections)}")
        
        if results['important_missing']:
            print(f"  ⚠️  Important missing sections:")
            for section in results['important_missing'][:5]:
                print(f"    • {section}")
        
        return results
    
    def verify_data_model_completeness(self) -> Dict[str, Any]:
        """Verify that all data models were extracted"""
        print("\n📋 Verifying data model completeness...")
        
        # Find model references in original text
        original_models = self.find_models_in_text()
        
        # Get models from semantic map
        semantic_models = list(self.semantic_map.get('data_models', {}).keys())
        
        # Compare
        original_set = set(original_models)
        semantic_set = set(semantic_models)
        
        missing_models = original_set - semantic_set
        extra_models = semantic_set - original_set
        matched = len(original_set & semantic_set)
        
        coverage_percentage = (matched / len(original_set) * 100) if original_set else 0
        
        results = {
            'total_original': len(original_set),
            'total_semantic': len(semantic_set),
            'matched': matched,
            'coverage_percentage': coverage_percentage,
            'missing_models': list(missing_models),
            'extra_models': list(extra_models),
            'original_models': list(original_set),
            'semantic_models': semantic_models
        }
        
        print(f"  📊 Original models found: {len(original_set)}")
        print(f"  📊 Semantic models extracted: {len(semantic_set)}")
        print(f"  📊 Matched models: {matched}")
        print(f"  📊 Coverage: {coverage_percentage:.1f}%")
        
        if missing_models:
            print(f"  ❌ Missing {len(missing_models)} models:")
            for model in list(missing_models)[:5]:
                print(f"    • {model}")
        
        return results
    
    def find_models_in_text(self) -> List[str]:
        """Find all data model references in the original text"""
        models = set()
        
        # Look for object/model patterns
        model_patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+object',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Object',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+entity',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+model',
            r'Object\s+Parameters:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        ]
        
        for pattern in model_patterns:
            matches = re.findall(pattern, self.clean_text)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                
                # Clean and validate the model name
                clean_name = match.strip()
                if (len(clean_name) > 1 and 
                    not any(word in clean_name.lower() for word in ['response', 'request', 'error', 'example'])):
                    models.add(clean_name)
        
        return list(models)
    
    def verify_business_rules_extraction(self) -> Dict[str, Any]:
        """Verify that business rules and validation were captured"""
        print("\n📏 Verifying business rules extraction...")
        
        # Find business rule indicators in original text
        business_rule_patterns = [
            r'must\s+[^.]+',
            r'should\s+[^.]+',
            r'cannot\s+[^.]+',
            r'required\s+to\s+[^.]+',
            r'only\s+if\s+[^.]+',
            r'when\s+[^.]+\s+then\s+[^.]+',
        ]
        
        original_rules = []
        for pattern in business_rule_patterns:
            matches = re.findall(pattern, self.clean_text, re.IGNORECASE)
            original_rules.extend(matches)
        
        # Count business rules in semantic map
        semantic_rules = []
        for endpoint in self.semantic_map.get('endpoints', []):
            semantic_rules.extend(endpoint.get('business_rules', []))
            semantic_rules.extend(endpoint.get('validation_rules', []))
        
        for model in self.semantic_map.get('data_models', {}).values():
            for prop in model.get('properties', {}).values():
                semantic_rules.extend(prop.get('business_rules', []))
        
        results = {
            'original_rules_found': len(original_rules),
            'semantic_rules_extracted': len(semantic_rules),
            'extraction_ratio': len(semantic_rules) / len(original_rules) if original_rules else 0,
            'sample_original_rules': original_rules[:5],
            'sample_semantic_rules': semantic_rules[:5]
        }
        
        print(f"  📊 Business rule patterns found: {len(original_rules)}")
        print(f"  📊 Business rules extracted: {len(semantic_rules)}")
        print(f"  📊 Extraction ratio: {results['extraction_ratio']:.2f}")
        
        return results
    
    def verify_code_examples_preservation(self) -> Dict[str, Any]:
        """Verify that code examples were preserved"""
        print("\n💻 Verifying code examples preservation...")
        
        # Find code blocks in original text
        curl_pattern = r'curl\s+[^\n]*(?:\n\s*[^curl\n]*)*'
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        
        original_curl = re.findall(curl_pattern, self.clean_text, re.IGNORECASE | re.MULTILINE)
        original_json = re.findall(json_pattern, self.clean_text)
        
        # Large JSON blocks only
        original_json = [j for j in original_json if len(j) > 50]
        
        # Count code examples in semantic map
        semantic_curl = []
        semantic_json = []
        
        for endpoint in self.semantic_map.get('endpoints', []):
            examples = endpoint.get('code_examples', {})
            if examples.get('curl'):
                semantic_curl.append(examples['curl'])
            if examples.get('json'):
                semantic_json.append(examples['json'])
        
        results = {
            'original_curl': len(original_curl),
            'original_json': len(original_json),
            'semantic_curl': len(semantic_curl),
            'semantic_json': len(semantic_json),
            'curl_preservation': len(semantic_curl) / len(original_curl) if original_curl else 0,
            'json_preservation': len(semantic_json) / len(original_json) if original_json else 0
        }
        
        print(f"  📊 Original cURL examples: {len(original_curl)}")
        print(f"  📊 Preserved cURL examples: {len(semantic_curl)}")
        print(f"  📊 Original JSON examples: {len(original_json)}")
        print(f"  📊 Preserved JSON examples: {len(semantic_json)}")
        print(f"  📊 cURL preservation: {results['curl_preservation']:.2f}")
        print(f"  📊 JSON preservation: {results['json_preservation']:.2f}")
        
        return results
    
    def verify_authentication_extraction(self) -> Dict[str, Any]:
        """Verify authentication information extraction"""
        print("\n🔐 Verifying authentication extraction...")
        
        # Look for auth patterns in original text
        auth_patterns = {
            'api_key': ['api key', 'api-key', 'apikey'],
            'bearer': ['bearer token', 'bearer', 'authorization header'],
            'oauth': ['oauth', 'oauth2', 'oauth 2.0'],
            'basic': ['basic auth', 'basic authentication']
        }
        
        found_in_original = []
        text_lower = self.clean_text.lower()
        
        for auth_type, keywords in auth_patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                found_in_original.append(auth_type)
        
        # Check semantic map
        semantic_auth = self.semantic_map.get('authentication', {}).get('methods', [])
        semantic_types = [method.get('type') for method in semantic_auth]
        
        results = {
            'found_in_original': found_in_original,
            'extracted_in_semantic': semantic_types,
            'missing_auth_types': list(set(found_in_original) - set(semantic_types)),
            'auth_coverage': len(set(found_in_original) & set(semantic_types)) / len(found_in_original) if found_in_original else 1
        }
        
        print(f"  📊 Auth types in original: {found_in_original}")
        print(f"  📊 Auth types extracted: {semantic_types}")
        print(f"  📊 Coverage: {results['auth_coverage']:.2f}")
        
        if results['missing_auth_types']:
            print(f"  ❌ Missing auth types: {results['missing_auth_types']}")
        
        return results
    
    def generate_verification_report(self) -> Dict[str, Any]:
        """Generate comprehensive verification report"""
        print("🔍 SEMANTIC MAP VERIFICATION REPORT")
        print("=" * 70)
        
        if not self.load_all_data():
            return {'error': 'Failed to load data'}
        
        # Run all verifications
        endpoint_results = self.verify_endpoint_completeness()
        section_results = self.verify_section_coverage()
        model_results = self.verify_data_model_completeness()
        rules_results = self.verify_business_rules_extraction()
        examples_results = self.verify_code_examples_preservation()
        auth_results = self.verify_authentication_extraction()
        
        # Calculate overall score
        scores = [
            endpoint_results.get('coverage_percentage', 0) / 100,
            section_results.get('coverage_percentage', 0) / 100,
            model_results.get('coverage_percentage', 0) / 100,
            rules_results.get('extraction_ratio', 0),
            examples_results.get('curl_preservation', 0),
            auth_results.get('auth_coverage', 0)
        ]
        
        overall_score = sum(scores) / len(scores) * 100
        
        # Compile full report
        report = {
            'overall_score': overall_score,
            'endpoint_verification': endpoint_results,
            'section_verification': section_results,
            'model_verification': model_results,
            'business_rules_verification': rules_results,
            'code_examples_verification': examples_results,
            'authentication_verification': auth_results,
            'recommendations': self.generate_recommendations(
                endpoint_results, section_results, model_results, 
                rules_results, examples_results, auth_results
            )
        }
        
        print(f"\n📊 OVERALL VERIFICATION SCORE: {overall_score:.1f}%")
        
        return report
    
    def generate_recommendations(self, *verification_results) -> List[str]:
        """Generate recommendations based on verification results"""
        recommendations = []
        
        endpoint_results, section_results, model_results, rules_results, examples_results, auth_results = verification_results
        
        # Endpoint recommendations
        if endpoint_results.get('coverage_percentage', 0) < 90:
            recommendations.append("🔗 Consider improving endpoint pattern detection - some endpoints may be missed")
        
        if endpoint_results.get('missing_endpoints'):
            recommendations.append("🔍 Review missing endpoints and check if they're valid API endpoints")
        
        # Section recommendations
        if section_results.get('coverage_percentage', 0) < 80:
            recommendations.append("📖 Improve section coverage - important documentation sections may be skipped")
        
        # Model recommendations
        if model_results.get('coverage_percentage', 0) < 85:
            recommendations.append("📋 Enhance data model detection - some object definitions may be missed")
        
        # Business rules recommendations
        if rules_results.get('extraction_ratio', 0) < 0.3:
            recommendations.append("📏 Improve business rule extraction patterns to capture more validation logic")
        
        # Code examples recommendations
        if examples_results.get('curl_preservation', 0) < 0.8:
            recommendations.append("💻 Enhance code example preservation, especially cURL commands")
        
        # Authentication recommendations
        if auth_results.get('missing_auth_types'):
            recommendations.append("🔐 Review authentication extraction - some auth methods may be missed")
        
        # General recommendations
        recommendations.extend([
            "🔄 Re-run extraction with updated patterns if coverage is low",
            "👀 Manually review missing items to improve extraction patterns",
            "📊 Use this report to iterate on the semantic extractor",
            "🎯 Focus on improving areas with lowest scores first"
        ])
        
        return recommendations
    
    def save_verification_report(self, output_path: str = None) -> str:
        """Generate and save verification report"""
        report = self.generate_verification_report()
        
        if output_path is None:
            output_path = self.api_docs_dir / f"verification_report.json"
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 Verification report saved to: {output_path}")
        
        # Print recommendations
        if 'recommendations' in report:
            print(f"\n💡 RECOMMENDATIONS:")
            for i, rec in enumerate(report['recommendations'], 1):
                print(f"  {i}. {rec}")
        
        return str(output_path)

def main():
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python semantic_verifier.py <api_docs_directory> <semantic_map_file> [output_file]")
        print("\nExamples:")
        print("  python semantic_verifier.py column_com_api_docs column_semantic_map.json")
        print("  python semantic_verifier.py stripe_com_api_docs stripe_semantic_map.json verification.json")
        sys.exit(1)
    
    api_docs_dir = sys.argv[1]
    semantic_map_file = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        verifier = SemanticMapVerifier(api_docs_dir, semantic_map_file)
        report_path = verifier.save_verification_report(output_file)
        
        print(f"\n✅ Verification completed!")
        print(f"📄 Report saved to: {report_path}")
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()