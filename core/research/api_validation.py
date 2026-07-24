#!/usr/bin/env python3
"""
Validation script for API-focused crawler output
Works with the simplified output structure from api_crawler.py
"""

import json
import os
from pathlib import Path
from collections import Counter, defaultdict
import re

class APIDocumentationValidator:
    def __init__(self, api_docs_dir):
        self.api_docs_dir = Path(api_docs_dir)
        self.crawl_report = None
        self.html_files = []
        self.text_files = []
        self.sections_files = []
        
    def load_data(self):
        """Load all data from the API docs directory"""
        print("📊 Loading API documentation data...")
        
        if not self.api_docs_dir.exists():
            print(f"❌ Directory not found: {self.api_docs_dir}")
            return False
        
        # Load crawl report
        crawl_report_path = self.api_docs_dir / 'crawl_report.json'
        if crawl_report_path.exists():
            with open(crawl_report_path, 'r') as f:
                self.crawl_report = json.load(f)
            print(f"✅ Loaded crawl report")
        else:
            print(f"⚠️  No crawl report found")
        
        # Find files
        self.html_files = list(self.api_docs_dir.glob("*.html"))
        self.text_files = list(self.api_docs_dir.glob("*_clean.txt"))
        self.sections_files = list(self.api_docs_dir.glob("*_sections.json"))
        
        print(f"📄 Found {len(self.html_files)} HTML files")
        print(f"📝 Found {len(self.text_files)} text files")
        print(f"📊 Found {len(self.sections_files)} section files")
        
        return len(self.html_files) > 0
    
    def analyze_crawl_status(self):
        """Analyze the overall crawl status"""
        print("\n🚀 CRAWL STATUS ANALYSIS")
        print("=" * 50)
        
        if not self.crawl_report:
            print("❌ No crawl report available")
            return
        
        status = self.crawl_report.get('status', 'unknown')
        url = self.crawl_report.get('url', 'unknown')
        timestamp = self.crawl_report.get('timestamp', 'unknown')
        
        print(f"🎯 Target URL: {url}")
        print(f"⏰ Crawled at: {timestamp}")
        print(f"📊 Status: {status}")
        
        if status == 'success':
            print("✅ Crawl completed successfully")
        elif status == 'warning':
            print("⚠️  Crawl completed with warnings")
        elif status == 'failed':
            error = self.crawl_report.get('error', 'Unknown error')
            print(f"❌ Crawl failed: {error}")
        
        # Analyze files created
        files = self.crawl_report.get('files', [])
        if files:
            print(f"\n📁 Files created:")
            for file_info in files:
                file_type = file_info.get('type', 'unknown')
                filename = file_info.get('filename', 'unknown')
                size = file_info.get('size', 0)
                print(f"  {file_type}: {filename} ({size:,} bytes)")
    
    def analyze_content_validation(self):
        """Analyze content validation results"""
        print("\n🔍 CONTENT VALIDATION ANALYSIS")
        print("=" * 50)
        
        if not self.crawl_report or 'validation' not in self.crawl_report:
            print("❌ No validation data available")
            return
        
        validation = self.crawl_report['validation']
        
        content_length = validation.get('content_length', 0)
        api_indicators = validation.get('api_indicators', [])
        http_methods = validation.get('http_methods', [])
        is_valid = validation.get('is_valid', False)
        
        print(f"📏 Content length: {content_length:,} characters")
        print(f"🎯 API indicators found: {len(api_indicators)}")
        print(f"🔧 HTTP methods found: {len(http_methods)}")
        print(f"✅ Validation passed: {is_valid}")
        
        if api_indicators:
            print(f"\n🏷️  API Indicators:")
            for indicator in api_indicators[:10]:  # Show first 10
                print(f"  • {indicator}")
            if len(api_indicators) > 10:
                print(f"  ... and {len(api_indicators) - 10} more")
        
        if http_methods:
            print(f"\n🔧 HTTP Methods:")
            for method in http_methods:
                print(f"  • {method}")
        
        # Quality assessment
        print(f"\n📊 Quality Assessment:")
        if content_length < 1000:
            print("  ❌ Very short content - may not have loaded properly")
        elif content_length < 5000:
            print("  ⚠️  Short content - check if complete")
        else:
            print("  ✅ Good content length")
        
        if len(api_indicators) < 3:
            print("  ❌ Few API indicators - may not be API documentation")
        elif len(api_indicators) < 5:
            print("  ⚠️  Some API indicators found")
        else:
            print("  ✅ Rich API content detected")
        
        if len(http_methods) < 2:
            print("  ❌ Few HTTP methods - incomplete API coverage")
        else:
            print("  ✅ Multiple HTTP methods found")
    
    def analyze_section_structure(self):
        """Analyze the section structure of the API documentation"""
        print("\n📖 SECTION STRUCTURE ANALYSIS")
        print("=" * 50)
        
        if not self.sections_files:
            print("❌ No section files found")
            return
        
        all_sections = []
        for sections_file in self.sections_files:
            try:
                with open(sections_file, 'r') as f:
                    sections = json.load(f)
                    all_sections.extend(sections)
            except Exception as e:
                print(f"⚠️  Could not load {sections_file}: {e}")
        
        if not all_sections:
            print("❌ No sections loaded")
            return
        
        print(f"📊 Total sections found: {len(all_sections)}")
        
        # Analyze by heading level
        level_counts = Counter(section['level'] for section in all_sections)
        print(f"\n📝 Sections by heading level:")
        for level in sorted(level_counts.keys()):
            print(f"  H{level}: {level_counts[level]} sections")
        
        # Analyze sections with API content
        endpoint_sections = [s for s in all_sections if s.get('hasEndpoints', False)]
        code_sections = [s for s in all_sections if s.get('hasCodeExamples', False)]
        
        print(f"\n🔗 Sections with API content:")
        print(f"  With endpoints: {len(endpoint_sections)}")
        print(f"  With code examples: {len(code_sections)}")
        
        # Show important sections
        important_sections = [s for s in all_sections 
                            if s.get('hasEndpoints', False) or s.get('hasCodeExamples', False)]
        
        if important_sections:
            print(f"\n🎯 Important API sections:")
            for section in important_sections[:10]:  # Show first 10
                indicators = []
                if section.get('hasEndpoints', False):
                    indicators.append('endpoints')
                if section.get('hasCodeExamples', False):
                    indicators.append('code')
                
                indicator_text = f" ({', '.join(indicators)})" if indicators else ""
                print(f"  H{section['level']}: {section['text'][:60]}...{indicator_text}")
            
            if len(important_sections) > 10:
                print(f"  ... and {len(important_sections) - 10} more sections")
        
        return all_sections
    
    def analyze_api_coverage(self):
        """Analyze API coverage by looking at content patterns"""
        print("\n🔗 API COVERAGE ANALYSIS")
        print("=" * 50)
        
        if not self.text_files:
            print("❌ No text files found for analysis")
            return
        
        # Load text content
        all_text = ""
        for text_file in self.text_files:
            try:
                with open(text_file, 'r', encoding='utf-8') as f:
                    all_text += f.read() + "\n"
            except Exception as e:
                print(f"⚠️  Could not load {text_file}: {e}")
        
        if not all_text:
            print("❌ No text content loaded")
            return
        
        all_text_lower = all_text.lower()
        
        # Analyze HTTP methods
        http_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
        method_counts = {}
        for method in http_methods:
            count = len(re.findall(rf'\b{method}\b', all_text, re.IGNORECASE))
            if count > 0:
                method_counts[method] = count
        
        print(f"🔧 HTTP Methods found:")
        for method, count in sorted(method_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {method}: {count} occurrences")
        
        # Analyze key API concepts
        api_concepts = {
            'Authentication': ['authentication', 'auth', 'api key', 'bearer token', 'oauth', 'jwt'],
            'Webhooks': ['webhook', 'event', 'notification', 'callback'],
            'Rate Limiting': ['rate limit', 'throttle', 'quota', 'limit'],
            'Pagination': ['pagination', 'paging', 'offset', 'cursor', 'next', 'previous'],
            'Errors': ['error', 'exception', 'status code', '400', '401', '403', '404', '500'],
            'Accounts': ['account', 'customer', 'user'],
            'Transfers': ['transfer', 'payment', 'transaction', 'move money'],
            'Entities': ['entity', 'business', 'company', 'organization'],
            'Compliance': ['compliance', 'kyc', 'aml', 'regulation'],
            'Testing': ['test', 'sandbox', 'simulation', 'mock']
        }
        
        concept_coverage = {}
        for concept, keywords in api_concepts.items():
            matches = []
            for keyword in keywords:
                if keyword in all_text_lower:
                    count = all_text_lower.count(keyword)
                    matches.append((keyword, count))
            
            if matches:
                concept_coverage[concept] = {
                    'found': True,
                    'matches': matches,
                    'total_mentions': sum(count for _, count in matches)
                }
            else:
                concept_coverage[concept] = {'found': False, 'matches': [], 'total_mentions': 0}
        
        print(f"\n🎯 API Concept Coverage:")
        for concept, data in concept_coverage.items():
            status = "✅" if data['found'] else "❌"
            mentions = data['total_mentions']
            print(f"  {status} {concept}: {mentions} mentions")
            
            if data['found'] and mentions > 0:
                top_matches = sorted(data['matches'], key=lambda x: x[1], reverse=True)[:3]
                keywords_text = ", ".join([f"{kw}({count})" for kw, count in top_matches])
                print(f"    Top keywords: {keywords_text}")
        
        # Overall assessment
        concepts_found = sum(1 for data in concept_coverage.values() if data['found'])
        total_concepts = len(concept_coverage)
        coverage_percentage = (concepts_found / total_concepts) * 100
        
        print(f"\n📊 Overall API Coverage: {concepts_found}/{total_concepts} concepts ({coverage_percentage:.1f}%)")
        
        if coverage_percentage >= 80:
            print("🎉 Excellent API coverage!")
        elif coverage_percentage >= 60:
            print("👍 Good API coverage")
        elif coverage_percentage >= 40:
            print("⚠️  Moderate API coverage - some areas may be missing")
        else:
            print("❌ Low API coverage - major gaps detected")
        
        return concept_coverage
    
    def generate_recommendations(self):
        """Generate recommendations based on analysis"""
        print("\n💡 RECOMMENDATIONS")
        print("=" * 50)
        
        recommendations = []
        
        # Check crawl status
        if self.crawl_report:
            status = self.crawl_report.get('status', 'unknown')
            if status == 'failed':
                recommendations.append("🔄 Re-run the crawler - the crawl failed completely")
            elif status == 'warning':
                recommendations.append("🔍 Check content quality - crawl completed with warnings")
        
        # Check content validation
        if self.crawl_report and 'validation' in self.crawl_report:
            validation = self.crawl_report['validation']
            
            if validation.get('content_length', 0) < 5000:
                recommendations.append("📏 Content seems short - check if page loaded completely")
            
            if len(validation.get('api_indicators', [])) < 5:
                recommendations.append("🎯 Few API indicators found - verify this is the correct API documentation URL")
            
            if len(validation.get('http_methods', [])) < 3:
                recommendations.append("🔧 Limited HTTP methods found - check if all API endpoints are documented")
        
        # Check file existence
        if not self.html_files:
            recommendations.append("📄 No HTML files found - crawler may have failed to save content")
        
        if not self.text_files:
            recommendations.append("📝 No text files found - may affect content analysis")
        
        # General recommendations
        recommendations.extend([
            "📤 Use the HTML file for LLM analysis - it contains the most complete content",
            "🔧 Use extract_api_docs.py to process the HTML file for structured analysis",
            "📊 Check the sections file to understand the documentation structure",
            "🚀 If content seems incomplete, try running the crawler again with a longer wait time"
        ])
        
        for i, rec in enumerate(recommendations, 1):
            print(f"  {i}. {rec}")
    
    def run_full_validation(self):
        """Run complete validation analysis"""
        print("🔍 API DOCUMENTATION VALIDATION")
        print("=" * 70)
        
        if not self.load_data():
            print("❌ Failed to load data - exiting")
            return False
        
        self.analyze_crawl_status()
        self.analyze_content_validation()
        sections = self.analyze_section_structure()
        coverage = self.analyze_api_coverage()
        self.generate_recommendations()
        
        print(f"\n📁 All files are in: {self.api_docs_dir}")
        
        return True

def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python api_validation.py <api_docs_directory>")
        print("\nExamples:")
        print("  python api_validation.py column_com_api_docs")
        print("  python api_validation.py stripe_com_api_docs")
        sys.exit(1)
    
    api_docs_dir = sys.argv[1]
    
    validator = APIDocumentationValidator(api_docs_dir)
    success = validator.run_full_validation()
    
    if success:
        print("\n✅ Validation completed successfully!")
    else:
        print("\n❌ Validation failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()