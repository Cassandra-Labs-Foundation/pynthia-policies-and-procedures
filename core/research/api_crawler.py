#!/usr/bin/env python3
"""
Focused API documentation crawler
Specifically designed to extract comprehensive API pages without sidebars
"""

import os
import sys
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse

class APIDocumentationCrawler:
    def __init__(self, api_url, output_dir=None):
        self.api_url = api_url.rstrip('/')
        self.domain = urlparse(api_url).netloc
        
        # Create output directory based on domain if not specified
        if output_dir is None:
            clean_domain = self.domain.replace('.', '_')
            output_dir = f"{clean_domain}_api_docs"
        
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        print(f"🎯 API URL: {self.api_url}")
        print(f"📁 Output directory: {self.output_dir}")
    
    def sanitize_filename(self, url):
        """Create safe filename from URL"""
        filename = url.replace("https://", "").replace("http://", "")
        filename = filename.replace("/", "_").replace("?", "_").replace("#", "_")
        return filename.strip("_") + ".html"
    
    def scroll_and_load_content(self, page):
        """Scroll through the page to trigger lazy loading"""
        print("📜 Scrolling to load all content...")
        
        page.evaluate("""
            async () => {
                const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
                
                // Get total scroll height
                const getScrollHeight = () => Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                );
                
                let lastHeight = getScrollHeight();
                let scrollPosition = 0;
                const scrollStep = window.innerHeight / 2;
                
                // Scroll down gradually
                while (scrollPosition < lastHeight) {
                    window.scrollTo(0, scrollPosition);
                    await delay(200);
                    scrollPosition += scrollStep;
                    
                    // Check if new content loaded
                    const newHeight = getScrollHeight();
                    if (newHeight > lastHeight) {
                        lastHeight = newHeight;
                    }
                }
                
                // Scroll back to top
                window.scrollTo(0, 0);
                await delay(1000);
            }
        """)
    
    def remove_sidebar_and_nav(self, page):
        """Remove sidebar, navigation, and other non-content elements"""
        print("🗑️  Removing sidebar and navigation elements...")
        
        page.evaluate("""
            () => {
                // Comprehensive list of sidebar and navigation selectors
                const removeSelectors = [
                    // Sidebar elements
                    'aside',
                    '[class*="sidebar"]',
                    '[id*="sidebar"]',
                    '.docs-sidebar',
                    '.navigation-sidebar',
                    '.menu-sidebar',
                    
                    // Table of contents
                    '[class*="toc"]',
                    '[class*="table-of-contents"]',
                    '.table-of-contents',
                    
                    // Navigation (but keep main nav if it's part of content)
                    'nav:not(main nav):not([role="main"])',
                    '[class*="nav-"]:not([class*="content"])',
                    '.docs-nav',
                    '.api-nav',
                    
                    // Header and footer
                    'header:not(main header):not([role="main"])',
                    'footer',
                    
                    // Common UI elements
                    '[class*="cookie"]',
                    '[class*="banner"]',
                    '[class*="announcement"]',
                    '[class*="toolbar"]',
                    '[class*="breadcrumb"]',
                    
                    // Ads and tracking
                    '[class*="ad"]',
                    '[class*="advertisement"]',
                    '[class*="tracking"]',
                    '[class*="analytics"]'
                ];
                
                removeSelectors.forEach(selector => {
                    try {
                        document.querySelectorAll(selector).forEach(el => {
                            // Additional check: only remove if it looks like navigation
                            const links = el.querySelectorAll('a');
                            const text = el.textContent.trim();
                            
                            // Remove if it has many links (likely navigation) or matches common patterns
                            if (links.length > 2 || 
                                text.includes('Table of Contents') ||
                                text.includes('Navigation') ||
                                el.closest('.sidebar, aside, nav')) {
                                el.remove();
                            }
                        });
                    } catch (e) {
                        console.log('Could not remove selector:', selector);
                    }
                });
                
                // Remove any remaining empty containers
                document.querySelectorAll('div, section').forEach(el => {
                    if (el.children.length === 0 && el.textContent.trim() === '') {
                        el.remove();
                    }
                });
            }
        """)
    
    def validate_api_content(self, page):
        """Validate that we have meaningful API content"""
        print("🔍 Validating API content...")
        
        page_text = page.evaluate('document.body ? document.body.innerText.toLowerCase() : ""')
        content_length = len(page_text)
        
        # Check for API indicators
        api_indicators = [
            'endpoint', 'api', 'get', 'post', 'put', 'delete', 'patch',
            'parameter', 'response', 'request', 'authentication', 'webhook',
            'json', 'curl', 'authorization', 'bearer', 'token'
        ]
        
        found_indicators = [indicator for indicator in api_indicators 
                          if indicator in page_text]
        
        # Check for HTTP methods
        http_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        found_methods = [method for method in http_methods 
                        if method.lower() in page_text]
        
        validation = {
            'content_length': content_length,
            'api_indicators': found_indicators,
            'http_methods': found_methods,
            'indicator_count': len(found_indicators),
            'method_count': len(found_methods)
        }
        
        print(f"  Content length: {content_length:,} characters")
        print(f"  API indicators found: {len(found_indicators)} ({', '.join(found_indicators[:5])}{'...' if len(found_indicators) > 5 else ''})")
        print(f"  HTTP methods found: {len(found_methods)} ({', '.join(found_methods)})")
        
        # Determine if content looks valid
        is_valid = (content_length > 1000 and 
                   len(found_indicators) >= 3 and 
                   len(found_methods) >= 2)
        
        validation['is_valid'] = is_valid
        
        if not is_valid:
            print("⚠️  Warning: Content may be incomplete or failed to load properly")
        else:
            print("✅ Content validation passed")
        
        return validation
    
    def extract_api_sections(self, page):
        """Extract information about API sections for analysis"""
        print("📊 Analyzing API section structure...")
        
        sections = page.evaluate("""
            () => {
                const sections = [];
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                
                headings.forEach(heading => {
                    const text = heading.textContent.trim();
                    const level = parseInt(heading.tagName.substring(1));
                    const id = heading.id || '';
                    
                    // Check if this section contains API-related content
                    let hasEndpoints = false;
                    let hasCodeExamples = false;
                    
                    // Look in the section following this heading
                    let nextElement = heading.nextElementSibling;
                    let sectionContent = '';
                    
                    while (nextElement && !nextElement.matches('h1, h2, h3, h4, h5, h6')) {
                        sectionContent += nextElement.textContent + ' ';
                        
                        // Check for endpoints
                        if (nextElement.querySelector('code') || 
                            /GET|POST|PUT|DELETE|PATCH/.test(nextElement.textContent)) {
                            hasEndpoints = true;
                        }
                        
                        // Check for code examples
                        if (nextElement.querySelector('pre, code')) {
                            hasCodeExamples = true;
                        }
                        
                        nextElement = nextElement.nextElementSibling;
                    }
                    
                    sections.push({
                        text: text,
                        level: level,
                        id: id,
                        hasEndpoints: hasEndpoints,
                        hasCodeExamples: hasCodeExamples,
                        contentLength: sectionContent.length
                    });
                });
                
                return sections;
            }
        """)
        
        print(f"  Found {len(sections)} sections:")
        for section in sections[:10]:  # Show first 10
            indicators = []
            if section['hasEndpoints']:
                indicators.append('endpoints')
            if section['hasCodeExamples']:
                indicators.append('code')
            
            indicator_text = f" ({', '.join(indicators)})" if indicators else ""
            print(f"    H{section['level']}: {section['text'][:50]}...{indicator_text}")
        
        if len(sections) > 10:
            print(f"    ... and {len(sections) - 10} more sections")
        
        return sections
    
    def crawl_api_page(self):
        """Main method to crawl the API documentation page"""
        print(f"🚀 Starting API documentation crawl...")
        
        result = {
            'url': self.api_url,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'status': 'unknown',
            'files': [],
            'validation': {},
            'sections': [],
            'error': None
        }
        
        try:
            with sync_playwright() as p:
                # Launch browser
                browser = p.chromium.launch(
                    headless=True,
                    args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                )
                
                # Create context with realistic settings
                context = browser.new_context(
                    viewport={'width': 1920, 'height': 1080},
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                )
                
                page = context.new_page()
                
                # Set longer timeouts for heavy pages
                page.set_default_timeout(90000)
                
                try:
                    # Navigate to API page
                    print(f"📄 Loading {self.api_url}...")
                    page.goto(self.api_url, wait_until="networkidle", timeout=90000)
                    
                    # Wait for initial content
                    print("⏳ Waiting for content to load...")
                    page.wait_for_timeout(3000)
                    
                    # Wait for main content area
                    try:
                        page.wait_for_selector('main, article, [class*="content"], [class*="api"], [class*="docs"]', timeout=15000)
                    except:
                        print("⚠️  Main content selector not found, proceeding...")
                    
                    # Scroll to load all content
                    self.scroll_and_load_content(page)
                    
                    # Additional wait after scrolling
                    page.wait_for_timeout(2000)
                    
                    # Analyze sections before cleanup
                    sections = self.extract_api_sections(page)
                    result['sections'] = sections
                    
                    # Remove sidebar and navigation
                    self.remove_sidebar_and_nav(page)
                    
                    # Validate content
                    validation = self.validate_api_content(page)
                    result['validation'] = validation
                    
                    # Get final content
                    html_content = page.content()
                    page_text = page.evaluate('document.body.innerText')
                    
                    # Save HTML file
                    html_filename = self.sanitize_filename(self.api_url)
                    html_path = self.output_dir / html_filename
                    
                    with open(html_path, 'w', encoding='utf-8') as f:
                        f.write(html_content)
                    
                    # Save text-only version
                    text_filename = html_filename.replace('.html', '_clean.txt')
                    text_path = self.output_dir / text_filename
                    
                    with open(text_path, 'w', encoding='utf-8') as f:
                        f.write(page_text)
                    
                    # Save section analysis
                    sections_filename = html_filename.replace('.html', '_sections.json')
                    sections_path = self.output_dir / sections_filename
                    
                    with open(sections_path, 'w', encoding='utf-8') as f:
                        json.dump(sections, f, indent=2)
                    
                    result['files'] = [
                        {'type': 'html', 'filename': html_filename, 'size': len(html_content)},
                        {'type': 'text', 'filename': text_filename, 'size': len(page_text)},
                        {'type': 'sections', 'filename': sections_filename, 'size': len(json.dumps(sections))}
                    ]
                    
                    result['status'] = 'success' if validation['is_valid'] else 'warning'
                    
                    print(f"\n✅ Successfully crawled API documentation!")
                    print(f"📄 HTML file: {html_filename} ({len(html_content):,} bytes)")
                    print(f"📝 Text file: {text_filename} ({len(page_text):,} chars)")
                    print(f"📊 Sections file: {sections_filename}")
                    
                except Exception as e:
                    result['status'] = 'failed'
                    result['error'] = str(e)
                    print(f"❌ Error during crawling: {e}")
                    raise
                
                finally:
                    browser.close()
        
        except Exception as e:
            result['status'] = 'failed'
            result['error'] = str(e)
            print(f"❌ Failed to crawl API page: {e}")
        
        # Save crawl report
        report_path = self.output_dir / 'crawl_report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
        
        print(f"\n📊 CRAWL SUMMARY:")
        print(f"  Status: {result['status']}")
        print(f"  Output directory: {self.output_dir}")
        print(f"  Files created: {len(result['files'])}")
        
        if result['validation']:
            val = result['validation']
            print(f"  Content length: {val['content_length']:,} characters")
            print(f"  API indicators: {val['indicator_count']}")
            print(f"  HTTP methods: {val['method_count']}")
        
        print(f"  Sections found: {len(result['sections'])}")
        
        return result

def main():
    if len(sys.argv) < 2:
        print("Usage: python api_crawler.py <api_url> [output_dir]")
        print("\nExamples:")
        print("  python api_crawler.py https://column.com/docs/api/")
        print("  python api_crawler.py https://stripe.com/docs/api my_output_dir")
        print("  python api_crawler.py https://docs.unit.co/")
        sys.exit(1)
    
    api_url = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Validate URL
    if not api_url.startswith(('http://', 'https://')):
        print(f"Error: URL must start with http:// or https://")
        sys.exit(1)
    
    # Create and run crawler
    crawler = APIDocumentationCrawler(api_url, output_dir)
    result = crawler.crawl_api_page()
    
    # Exit with appropriate code
    if result['status'] == 'success':
        print("\n🎉 Crawl completed successfully!")
        sys.exit(0)
    elif result['status'] == 'warning':
        print("\n⚠️  Crawl completed with warnings - check the content quality")
        sys.exit(0)
    else:
        print("\n💥 Crawl failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()