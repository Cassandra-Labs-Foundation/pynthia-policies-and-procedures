import json
import csv
import sys
from pathlib import Path
from typing import Dict, List, Set, Any
from collections import defaultdict
import codecs

class APIEndpointComparator:
    def __init__(self):
        self.apis = []
        self.all_endpoints = set()
        self.endpoint_methods = defaultdict(set)
        self.endpoint_details = defaultdict(lambda: defaultdict(dict))
        self.warnings = []
    
    def load_json_file(self, file_path: str) -> dict:
        """Load JSON file handling UTF-8 BOM and other encoding issues"""
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                return json.load(f)
        except UnicodeDecodeError:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            with open(file_path, 'rb') as f:
                content = f.read()
                if content.startswith(codecs.BOM_UTF8):
                    content = content[len(codecs.BOM_UTF8):]
                return json.loads(content.decode('utf-8'))
    
    def extract_schema_properties(self, schema: Dict, components: Dict = None) -> List[Dict]:
        """Extract properties from OpenAPI schema, resolving $ref if needed"""
        properties = []
        
        if not schema:
            return properties
        
        # Handle $ref
        if '$ref' in schema and components:
            ref_path = schema['$ref'].split('/')
            ref_schema = components
            for part in ref_path[1:]:  # Skip the '#'
                ref_schema = ref_schema.get(part, {})
            schema = ref_schema
        
        # Handle array type
        if schema.get('type') == 'array' and 'items' in schema:
            return self.extract_schema_properties(schema['items'], components)
        
        # Extract properties
        if 'properties' in schema:
            for prop_name, prop_schema in schema['properties'].items():
                prop_info = {
                    'name': prop_name,
                    'type': prop_schema.get('type', 'object'),
                    'required': prop_name in schema.get('required', []),
                    'description': prop_schema.get('description', ''),
                    'format': prop_schema.get('format', ''),
                    'enum': prop_schema.get('enum', [])
                }
                properties.append(prop_info)
        
        return properties
    
    def parse_openapi(self, file_path: str) -> Dict[str, Any]:
        """Parse OpenAPI specification file"""
        data = self.load_json_file(file_path)
        
        api_name = Path(file_path).stem
        endpoints = []
        has_refs = False
        components = data.get('components', {})
        
        for path, path_item in data.get('paths', {}).items():
            if isinstance(path_item, dict) and '$ref' in path_item:
                has_refs = True
                endpoint = {
                    'path': path,
                    'method': 'UNKNOWN',
                    'full_signature': f"UNKNOWN {path}",
                    'note': f"References external file: {path_item['$ref']}",
                    'parameters': [],
                    'request_body': {},
                    'responses': {}
                }
                endpoints.append(endpoint)
                self.all_endpoints.add(f"UNKNOWN {path}")
            else:
                for method in path_item.keys():
                    if method not in ['$ref', 'summary', 'description', 'servers', 'parameters']:
                        operation = path_item[method]
                        full_sig = f"{method.upper()} {path}"
                        
                        # Extract parameters
                        parameters = []
                        for param in operation.get('parameters', []):
                            param_info = {
                                'name': param.get('name', ''),
                                'in': param.get('in', ''),
                                'required': param.get('required', False),
                                'type': param.get('schema', {}).get('type', ''),
                                'description': param.get('description', '')
                            }
                            parameters.append(param_info)
                        
                        # Extract request body
                        request_body = {}
                        if 'requestBody' in operation:
                            req_body = operation['requestBody']
                            content = req_body.get('content', {})
                            for content_type, content_schema in content.items():
                                schema = content_schema.get('schema', {})
                                request_body[content_type] = self.extract_schema_properties(schema, components)
                        
                        # Extract responses
                        responses = {}
                        for status_code, response in operation.get('responses', {}).items():
                            content = response.get('content', {})
                            responses[status_code] = {}
                            for content_type, content_schema in content.items():
                                schema = content_schema.get('schema', {})
                                responses[status_code][content_type] = self.extract_schema_properties(schema, components)
                        
                        endpoint = {
                            'path': path,
                            'method': method.upper(),
                            'full_signature': full_sig,
                            'summary': operation.get('summary', ''),
                            'description': operation.get('description', ''),
                            'parameters': parameters,
                            'request_body': request_body,
                            'responses': responses,
                            'tags': operation.get('tags', [])
                        }
                        endpoints.append(endpoint)
                        self.all_endpoints.add(full_sig)
                        self.endpoint_methods[path].add(method.upper())
                        self.endpoint_details[full_sig][api_name] = endpoint
        
        if has_refs:
            warning = f"Warning: {api_name} uses $ref to external files. Methods are marked as UNKNOWN."
            self.warnings.append(warning)
            print(f"  ⚠️  {warning}")
        
        return {
            'name': api_name,
            'type': 'openapi',
            'base_url': data.get('servers', [{}])[0].get('url', ''),
            'endpoints': endpoints,
            'auth_methods': list(data.get('components', {}).get('securitySchemes', {}).keys()),
            'total_endpoints': len(endpoints),
            'has_external_refs': has_refs
        }
    
    def parse_semantic_model(self, file_path: str) -> Dict[str, Any]:
        """Parse semantic model JSON file"""
        data = self.load_json_file(file_path)
        
        api_name = data.get('provider', Path(file_path).stem)
        endpoints = []
        
        for endpoint in data.get('endpoints', []):
            path = endpoint.get('path', '')
            method = endpoint.get('method', 'GET').upper()
            full_sig = f"{method} {path}"
            
            # Extract parameters
            parameters = []
            for param in endpoint.get('parameters', []):
                param_info = {
                    'name': param.get('name', ''),
                    'in': param.get('location', ''),
                    'required': param.get('required', False),
                    'type': param.get('type', ''),
                    'description': param.get('description', '')
                }
                parameters.append(param_info)
            
            # Extract request body
            request_body = {}
            if 'request_body' in endpoint:
                req_body = endpoint['request_body']
                if 'properties' in req_body:
                    request_body['application/json'] = [
                        {
                            'name': prop.get('name', ''),
                            'type': prop.get('type', ''),
                            'required': prop.get('required', False),
                            'description': prop.get('description', ''),
                            'format': prop.get('format', ''),
                            'enum': prop.get('enum', [])
                        }
                        for prop in req_body['properties']
                    ]
            
            # Extract responses
            responses = {}
            for response in endpoint.get('responses', []):
                status_code = str(response.get('status_code', '200'))
                if 'properties' in response:
                    responses[status_code] = {
                        'application/json': [
                            {
                                'name': prop.get('name', ''),
                                'type': prop.get('type', ''),
                                'required': prop.get('required', False),
                                'description': prop.get('description', ''),
                                'format': prop.get('format', ''),
                                'enum': prop.get('enum', [])
                            }
                            for prop in response['properties']
                        ]
                    }
            
            endpoint_data = {
                'path': path,
                'method': method,
                'full_signature': full_sig,
                'name': endpoint.get('name', ''),
                'description': endpoint.get('description', ''),
                'confidence': endpoint.get('confidence', 0),
                'parameters': parameters,
                'request_body': request_body,
                'responses': responses
            }
            endpoints.append(endpoint_data)
            self.all_endpoints.add(full_sig)
            self.endpoint_methods[path].add(method)
            self.endpoint_details[full_sig][api_name] = endpoint_data
        
        auth_methods = [m.get('type') for m in data.get('authentication', {}).get('methods', [])]
        
        return {
            'name': api_name,
            'type': 'semantic',
            'base_url': data.get('api_overview', {}).get('base_url', ''),
            'endpoints': endpoints,
            'auth_methods': auth_methods,
            'data_models': list(data.get('data_models', {}).keys()),
            'webhooks': len(data.get('webhooks', [])),
            'total_endpoints': len(endpoints)
        }
    
    def load_api_file(self, file_path: str):
        """Auto-detect and load API file"""
        try:
            data = self.load_json_file(file_path)
            
            if 'openapi' in data or 'swagger' in data:
                api_data = self.parse_openapi(file_path)
            elif 'provider' in data or 'endpoints' in data:
                api_data = self.parse_semantic_model(file_path)
            else:
                print(f"Warning: Could not determine type for {file_path}")
                return
            
            self.apis.append(api_data)
            print(f"✓ Loaded: {api_data['name']} ({api_data['total_endpoints']} endpoints)")
            
        except Exception as e:
            print(f"✗ Error loading {file_path}: {e}")
            import traceback
            traceback.print_exc()
    
    def generate_path_comparison_csv(self, output_file: str = 'path_comparison.csv'):
        """Generate CSV comparing paths across APIs (regardless of method)"""
        if not self.apis:
            print("No APIs loaded.")
            return
        
        all_paths = set()
        for api in self.apis:
            for endpoint in api['endpoints']:
                all_paths.add(endpoint['path'])
        
        sorted_paths = sorted(all_paths)
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            header = ['Path'] + [api['name'] for api in self.apis]
            writer.writerow(header)
            
            for path in sorted_paths:
                row = [path]
                for api in self.apis:
                    api_paths = {ep['path'] for ep in api['endpoints']}
                    methods = [ep['method'] for ep in api['endpoints'] if ep['path'] == path]
                    if path in api_paths:
                        row.append(', '.join(methods) if methods else '✓')
                    else:
                        row.append('✗')
                writer.writerow(row)
        
        print(f"✓ Path comparison saved to: {output_file}")
    
    def generate_endpoint_matrix_csv(self, output_file: str = 'endpoint_comparison.csv'):
        """Generate CSV with endpoint coverage matrix"""
        if not self.apis:
            print("No APIs loaded.")
            return
        
        sorted_endpoints = sorted(self.all_endpoints)
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            header = ['Method', 'Path'] + [api['name'] for api in self.apis]
            writer.writerow(header)
            
            for endpoint in sorted_endpoints:
                parts = endpoint.split(' ', 1)
                method = parts[0] if len(parts) > 1 else 'UNKNOWN'
                path = parts[1] if len(parts) > 1 else parts[0]
                
                row = [method, path]
                for api in self.apis:
                    api_endpoints = {ep['full_signature'] for ep in api['endpoints']}
                    row.append('✓' if endpoint in api_endpoints else '✗')
                writer.writerow(row)
        
        print(f"✓ Endpoint matrix saved to: {output_file}")
    
    def generate_summary_csv(self, output_file: str = 'api_summary.csv'):
        """Generate summary comparison CSV"""
        if not self.apis:
            print("No APIs loaded.")
            return
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            writer.writerow(['Metric'] + [api['name'] for api in self.apis])
            writer.writerow(['Total Endpoints'] + [api['total_endpoints'] for api in self.apis])
            writer.writerow(['Base URL'] + [api.get('base_url', 'N/A') for api in self.apis])
            writer.writerow(['Authentication'] + [
                ', '.join(api.get('auth_methods', [])) or 'Not specified' 
                for api in self.apis
            ])
            writer.writerow(['Uses External Refs'] + [
                'Yes' if api.get('has_external_refs') else 'No'
                for api in self.apis
            ])
            writer.writerow(['Data Models'] + [
                len(api.get('data_models', [])) if 'data_models' in api else 'N/A'
                for api in self.apis
            ])
            writer.writerow(['Webhooks'] + [
                api.get('webhooks', 'N/A') if 'webhooks' in api else 'N/A'
                for api in self.apis
            ])
        
        print(f"✓ Summary saved to: {output_file}")
    
    def generate_detailed_csv(self, output_file: str = 'endpoint_details.csv'):
        """Generate detailed endpoint information CSV"""
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            writer.writerow(['API', 'Method', 'Path', 'Name', 'Description', 'Note'])
            
            for api in self.apis:
                for endpoint in api['endpoints']:
                    writer.writerow([
                        api['name'],
                        endpoint['method'],
                        endpoint['path'],
                        endpoint.get('name', ''),
                        endpoint.get('description', ''),
                        endpoint.get('note', '')
                    ])
        
        print(f"✓ Detailed endpoints saved to: {output_file}")
    
    def generate_parameters_comparison_csv(self, output_file: str = 'parameters_comparison.csv'):
        """Generate CSV comparing parameters for each endpoint across APIs"""
        if not self.apis:
            print("No APIs loaded.")
            return
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            writer.writerow(['Endpoint', 'Parameter Name', 'Location'] + 
                          [f"{api['name']} - Type" for api in self.apis] +
                          [f"{api['name']} - Required" for api in self.apis] +
                          [f"{api['name']} - Description" for api in self.apis])
            
            for endpoint_sig in sorted(self.all_endpoints):
                all_params = set()
                for api_name, endpoint_data in self.endpoint_details[endpoint_sig].items():
                    for param in endpoint_data.get('parameters', []):
                        all_params.add((param['name'], param.get('in', '')))
                
                for param_name, param_location in sorted(all_params):
                    row = [endpoint_sig, param_name, param_location]
                    
                    # Type columns
                    for api in self.apis:
                        endpoint_data = self.endpoint_details[endpoint_sig].get(api['name'])
                        if endpoint_data:
                            param = next((p for p in endpoint_data.get('parameters', []) 
                                        if p['name'] == param_name), None)
                            row.append(param['type'] if param else '✗')
                        else:
                            row.append('N/A')
                    
                    # Required columns
                    for api in self.apis:
                        endpoint_data = self.endpoint_details[endpoint_sig].get(api['name'])
                        if endpoint_data:
                            param = next((p for p in endpoint_data.get('parameters', []) 
                                        if p['name'] == param_name), None)
                            row.append('Yes' if param and param.get('required') else 'No')
                        else:
                            row.append('N/A')
                    
                    # Description columns
                    for api in self.apis:
                        endpoint_data = self.endpoint_details[endpoint_sig].get(api['name'])
                        if endpoint_data:
                            param = next((p for p in endpoint_data.get('parameters', []) 
                                        if p['name'] == param_name), None)
                            row.append(param.get('description', '') if param else '✗')
                        else:
                            row.append('N/A')
                    
                    writer.writerow(row)
        
        print(f"✓ Parameters comparison saved to: {output_file}")
    
    def generate_request_body_comparison_csv(self, output_file: str = 'request_body_comparison.csv'):
        """Generate CSV comparing request body properties across APIs"""
        if not self.apis:
            print("No APIs loaded.")
            return
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            writer.writerow(['Endpoint', 'Content-Type', 'Property Name'] + 
                          [f"{api['name']} - Type" for api in self.apis] +
                          [f"{api['name']} - Required" for api in self.apis] +
                          [f"{api['name']} - Description" for api in self.apis])
            
            for endpoint_sig in sorted(self.all_endpoints):
                all_props = defaultdict(set)
                
                for api_name, endpoint_data in self.endpoint_details[endpoint_sig].items():
                    for content_type, properties in endpoint_data.get('request_body', {}).items():
                        for prop in properties:
                            all_props[content_type].add(prop['name'])
                
                for content_type, prop_names in sorted(all_props.items()):
                    for prop_name in sorted(prop_names):
                        row = [endpoint_sig, content_type, prop_name]
                        
                        # Type columns
                        for api in self.apis:
                            endpoint_data = self.endpoint_details[endpoint_sig].get(api['name'])
                            if endpoint_data and content_type in endpoint_data.get('request_body', {}):
                                props = endpoint_data['request_body'][content_type]
                                prop = next((p for p in props if p['name'] == prop_name), None)
                                row.append(prop['type'] if prop else '✗')
                            else:
                                row.append('N/A')
                        
                        # Required columns
                        for api in self.apis:
                            endpoint_data = self.endpoint_details[endpoint_sig].get(api['name'])
                            if endpoint_data and content_type in endpoint_data.get('request_body', {}):
                                props = endpoint_data['request_body'][content_type]
                                prop = next((p for p in props if p['name'] == prop_name), None)
                                row.append('Yes' if prop and prop.get('required') else 'No')
                            else:
                                row.append('N/A')
                        
                        # Description columns
                        for api in self.apis:
                            endpoint_data = self.endpoint_details[endpoint_sig].get(api['name'])
                            if endpoint_data and content_type in endpoint_data.get('request_body', {}):
                                props = endpoint_data['request_body'][content_type]
                                prop = next((p for p in props if p['name'] == prop_name), None)
                                row.append(prop.get('description', '') if prop else '✗')
                            else:
                                row.append('N/A')
                        
                        writer.writerow(row)
        
        print(f"✓ Request body comparison saved to: {output_file}")
    
    def generate_response_comparison_csv(self, output_file: str = 'response_comparison.csv'):
        """Generate CSV comparing response properties across APIs"""
        if not self.apis:
            print("No APIs loaded.")
            return
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            writer.writerow(['Endpoint', 'Status Code', 'Content-Type', 'Property Name'] + 
                          [f"{api['name']} - Type" for api in self.apis] +
                          [f"{api['name']} - Description" for api in self.apis])
            
            for endpoint_sig in sorted(self.all_endpoints):
                all_responses = defaultdict(lambda: defaultdict(set))
                
                for api_name, endpoint_data in self.endpoint_details[endpoint_sig].items():
                    for status_code, content_types in endpoint_data.get('responses', {}).items():
                        for content_type, properties in content_types.items():
                            for prop in properties:
                                all_responses[status_code][content_type].add(prop['name'])
                
                for status_code, content_types in sorted(all_responses.items()):
                    for content_type, prop_names in sorted(content_types.items()):
                        for prop_name in sorted(prop_names):
                            row = [endpoint_sig, status_code, content_type, prop_name]
                            
                            # Type columns
                            for api in self.apis:
                                endpoint_data = self.endpoint_details[endpoint_sig].get(api['name'])
                                if (endpoint_data and 
                                    status_code in endpoint_data.get('responses', {}) and
                                    content_type in endpoint_data['responses'][status_code]):
                                    props = endpoint_data['responses'][status_code][content_type]
                                    prop = next((p for p in props if p['name'] == prop_name), None)
                                    row.append(prop['type'] if prop else '✗')
                                else:
                                    row.append('N/A')
                            
                            # Description columns
                            for api in self.apis:
                                endpoint_data = self.endpoint_details[endpoint_sig].get(api['name'])
                                if (endpoint_data and 
                                    status_code in endpoint_data.get('responses', {}) and
                                    content_type in endpoint_data['responses'][status_code]):
                                    props = endpoint_data['responses'][status_code][content_type]
                                    prop = next((p for p in props if p['name'] == prop_name), None)
                                    row.append(prop.get('description', '') if prop else '✗')
                                else:
                                    row.append('N/A')
                            
                            writer.writerow(row)
        
        print(f"✓ Response comparison saved to: {output_file}")
    
    def generate_property_statistics_csv(self, output_file: str = 'property_statistics.csv'):
        """Generate statistics about property alignment across APIs"""
        if not self.apis:
            print("No APIs loaded.")
            return
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            writer.writerow(['Endpoint', 'Total Parameters', 'Shared Parameters', 
                           'Total Request Properties', 'Shared Request Properties',
                           'Total Response Properties', 'Shared Response Properties',
                           'Parameter Alignment %', 'Request Alignment %', 'Response Alignment %'])
            
            for endpoint_sig in sorted(self.all_endpoints):
                endpoint_apis = self.endpoint_details[endpoint_sig]
                
                if len(endpoint_apis) < 2:
                    continue
                
                # Count parameters
                all_params = set()
                param_counts = defaultdict(int)
                for api_name, endpoint_data in endpoint_apis.items():
                    for param in endpoint_data.get('parameters', []):
                        param_name = param['name']
                        all_params.add(param_name)
                        param_counts[param_name] += 1
                
                shared_params = sum(1 for count in param_counts.values() if count == len(endpoint_apis))
                param_alignment = (shared_params / len(all_params) * 100) if all_params else 0
                
                # Count request properties
                all_req_props = set()
                req_prop_counts = defaultdict(int)
                for api_name, endpoint_data in endpoint_apis.items():
                    for content_type, properties in endpoint_data.get('request_body', {}).items():
                        for prop in properties:
                            prop_name = prop['name']
                            all_req_props.add(prop_name)
                            req_prop_counts[prop_name] += 1
                
                shared_req_props = sum(1 for count in req_prop_counts.values() if count == len(endpoint_apis))
                req_alignment = (shared_req_props / len(all_req_props) * 100) if all_req_props else 0
                
                # Count response properties
                all_resp_props = set()
                resp_prop_counts = defaultdict(int)
                for api_name, endpoint_data in endpoint_apis.items():
                    for status_code, content_types in endpoint_data.get('responses', {}).items():
                        for content_type, properties in content_types.items():
                            for prop in properties:
                                prop_name = prop['name']
                                all_resp_props.add(prop_name)
                                resp_prop_counts[prop_name] += 1
                
                shared_resp_props = sum(1 for count in resp_prop_counts.values() if count == len(endpoint_apis))
                resp_alignment = (shared_resp_props / len(all_resp_props) * 100) if all_resp_props else 0
                
                writer.writerow([
                    endpoint_sig,
                    len(all_params),
                    shared_params,
                    len(all_req_props),
                    shared_req_props,
                    len(all_resp_props),
                    shared_resp_props,
                    f"{param_alignment:.1f}%",
                    f"{req_alignment:.1f}%",
                    f"{resp_alignment:.1f}%"
                ])
        
        print(f"✓ Property statistics saved to: {output_file}")
    
    def generate_type_mismatch_csv(self, output_file: str = 'type_mismatches.csv'):
        """Generate CSV highlighting type mismatches across APIs"""
        if not self.apis:
            print("No APIs loaded.")
            return
        
        mismatches = []
        
        for endpoint_sig in sorted(self.all_endpoints):
            endpoint_apis = self.endpoint_details[endpoint_sig]
            
            if len(endpoint_apis) < 2:
                continue
            
            # Check parameter type mismatches
            all_params = defaultdict(list)
            for api_name, endpoint_data in endpoint_apis.items():
                for param in endpoint_data.get('parameters', []):
                    all_params[param['name']].append({
                        'api': api_name,
                        'type': param['type'],
                        'location': param.get('in', '')
                    })
            
            for param_name, param_list in all_params.items():
                if len(param_list) > 1:
                    types = set(p['type'] for p in param_list)
                    if len(types) > 1:
                        mismatches.append({
                            'endpoint': endpoint_sig,
                            'category': 'Parameter',
                            'property': param_name,
                            'location': param_list[0]['location'],
                            'details': ' | '.join([f"{p['api']}: {p['type']}" for p in param_list])
                        })
            
            # Check request body type mismatches
            all_req_props = defaultdict(lambda: defaultdict(list))
            for api_name, endpoint_data in endpoint_apis.items():
                for content_type, properties in endpoint_data.get('request_body', {}).items():
                    for prop in properties:
                        all_req_props[content_type][prop['name']].append({
                            'api': api_name,
                            'type': prop['type'],
                            'required': prop.get('required', False)
                        })
            
            for content_type, props in all_req_props.items():
                for prop_name, prop_list in props.items():
                    if len(prop_list) > 1:
                        types = set(p['type'] for p in prop_list)
                        if len(types) > 1:
                            mismatches.append({
                                'endpoint': endpoint_sig,
                                'category': 'Request Body',
                                'property': prop_name,
                                'location': content_type,
                                'details': ' | '.join([f"{p['api']}: {p['type']}" for p in prop_list])
                            })
            
            # Check response type mismatches
            all_resp_props = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
            for api_name, endpoint_data in endpoint_apis.items():
                for status_code, content_types in endpoint_data.get('responses', {}).items():
                    for content_type, properties in content_types.items():
                        for prop in properties:
                            all_resp_props[status_code][content_type][prop['name']].append({
                                'api': api_name,
                                'type': prop['type']
                            })
            
            for status_code, content_types in all_resp_props.items():
                for content_type, props in content_types.items():
                    for prop_name, prop_list in props.items():
                        if len(prop_list) > 1:
                            types = set(p['type'] for p in prop_list)
                            if len(types) > 1:
                                mismatches.append({
                                    'endpoint': endpoint_sig,
                                    'category': 'Response',
                                    'property': prop_name,
                                    'location': f"{status_code} - {content_type}",
                                    'details': ' | '.join([f"{p['api']}: {p['type']}" for p in prop_list])
                                })
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Endpoint', 'Category', 'Property Name', 'Location', 'Type Differences'])
            
            for mismatch in mismatches:
                writer.writerow([
                    mismatch['endpoint'],
                    mismatch['category'],
                    mismatch['property'],
                    mismatch['location'],
                    mismatch['details']
                ])
        
        print(f"✓ Type mismatches saved to: {output_file}")
    
    def generate_missing_properties_csv(self, output_file: str = 'missing_properties.csv'):
        """Generate CSV showing properties that exist in some APIs but not others"""
        if not self.apis:
            print("No APIs loaded.")
            return
        
        missing = []
        
        for endpoint_sig in sorted(self.all_endpoints):
            endpoint_apis = self.endpoint_details[endpoint_sig]
            
            if len(endpoint_apis) < 2:
                continue
            
            # Check missing parameters
            all_params = defaultdict(list)
            for api_name, endpoint_data in endpoint_apis.items():
                for param in endpoint_data.get('parameters', []):
                    all_params[param['name']].append(api_name)
            
            for param_name, api_list in all_params.items():
                if len(api_list) < len(endpoint_apis):
                    missing_apis = [api['name'] for api in self.apis if api['name'] not in api_list and api['name'] in endpoint_apis]
                    if missing_apis:
                        missing.append({
                            'endpoint': endpoint_sig,
                            'category': 'Parameter',
                            'property': param_name,
                            'present_in': ', '.join(api_list),
                            'missing_in': ', '.join(missing_apis)
                        })
            
            # Check missing request body properties
            all_req_props = defaultdict(list)
            for api_name, endpoint_data in endpoint_apis.items():
                for content_type, properties in endpoint_data.get('request_body', {}).items():
                    for prop in properties:
                        all_req_props[prop['name']].append(api_name)
            
            for prop_name, api_list in all_req_props.items():
                if len(api_list) < len(endpoint_apis):
                    missing_apis = [api['name'] for api in self.apis if api['name'] not in api_list and api['name'] in endpoint_apis]
                    if missing_apis:
                        missing.append({
                            'endpoint': endpoint_sig,
                            'category': 'Request Body',
                            'property': prop_name,
                            'present_in': ', '.join(api_list),
                            'missing_in': ', '.join(missing_apis)
                        })
            
            # Check missing response properties
            all_resp_props = defaultdict(list)
            for api_name, endpoint_data in endpoint_apis.items():
                for status_code, content_types in endpoint_data.get('responses', {}).items():
                    for content_type, properties in content_types.items():
                        for prop in properties:
                            all_resp_props[prop['name']].append(api_name)
            
            for prop_name, api_list in all_resp_props.items():
                if len(api_list) < len(endpoint_apis):
                    missing_apis = [api['name'] for api in self.apis if api['name'] not in api_list and api['name'] in endpoint_apis]
                    if missing_apis:
                        missing.append({
                            'endpoint': endpoint_sig,
                            'category': 'Response',
                            'property': prop_name,
                            'present_in': ', '.join(api_list),
                            'missing_in': ', '.join(missing_apis)
                        })
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Endpoint', 'Category', 'Property Name', 'Present In APIs', 'Missing In APIs'])
            
            for item in missing:
                writer.writerow([
                    item['endpoint'],
                    item['category'],
                    item['property'],
                    item['present_in'],
                    item['missing_in']
                ])
        
        print(f"✓ Missing properties saved to: {output_file}")
    
    def generate_summary_report(self):
        """Print a comprehensive summary report to console"""
        print("\n" + "="*60)
        print("DETAILED COMPARISON SUMMARY")
        print("="*60)
        
        # Overall statistics
        total_endpoints_per_api = {api['name']: api['total_endpoints'] for api in self.apis}
        print(f"\n📊 Endpoint Coverage:")
        for api_name, count in total_endpoints_per_api.items():
            print(f"   {api_name}: {count} endpoints")
        
        # Shared endpoints
        if len(self.apis) >= 2:
            shared_endpoints = set(self.all_endpoints)
            for api in self.apis:
                api_endpoints = {ep['full_signature'] for ep in api['endpoints']}
                shared_endpoints &= api_endpoints
            
            print(f"\n🤝 Shared across all APIs: {len(shared_endpoints)} endpoints")
            
            # Unique to each API
            print(f"\n🔍 Unique Endpoints:")
            for api in self.apis:
                api_endpoints = {ep['full_signature'] for ep in api['endpoints']}
                unique = api_endpoints - (self.all_endpoints - api_endpoints)
                other_endpoints = set()
                for other_api in self.apis:
                    if other_api['name'] != api['name']:
                        other_endpoints.update({ep['full_signature'] for ep in other_api['endpoints']})
                unique = api_endpoints - other_endpoints
                print(f"   {api['name']}: {len(unique)} unique endpoints")
        
        # Property alignment summary
        print(f"\n📋 Property Analysis:")
        total_mismatches = 0
        total_missing = 0
        
        for endpoint_sig in self.all_endpoints:
            endpoint_apis = self.endpoint_details[endpoint_sig]
            if len(endpoint_apis) >= 2:
                # Check for type mismatches
                all_params = defaultdict(list)
                for api_name, endpoint_data in endpoint_apis.items():
                    for param in endpoint_data.get('parameters', []):
                        all_params[param['name']].append(param['type'])
                
                for param_types in all_params.values():
                    if len(set(param_types)) > 1:
                        total_mismatches += 1
        
        print(f"   Type mismatches found: {total_mismatches}")
        print(f"   See type_mismatches.csv for details")
        print(f"   See missing_properties.csv for missing properties")

def main():
    if len(sys.argv) < 2:
        print("Usage: python api_comparison.py <file1.json> <file2.json> ...")
        print("\nExample:")
        print("  python api_comparison.py q2helix_openapi.json column_semantic_map.json")
        sys.exit(1)
    
    comparator = APIEndpointComparator()
    
    print("\n" + "="*60)
    print("LOADING API FILES")
    print("="*60 + "\n")
    
    for file_path in sys.argv[1:]:
        comparator.load_api_file(file_path)
    
    if not comparator.apis:
        print("\n✗ No APIs loaded successfully. Exiting.")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("GENERATING COMPARISON REPORTS")
    print("="*60 + "\n")
    
    # Generate all reports
    comparator.generate_path_comparison_csv('path_comparison.csv')
    comparator.generate_endpoint_matrix_csv('endpoint_comparison.csv')
    comparator.generate_summary_csv('api_summary.csv')
    comparator.generate_detailed_csv('endpoint_details.csv')
    
    # Generate property comparison reports
    comparator.generate_parameters_comparison_csv('parameters_comparison.csv')
    comparator.generate_request_body_comparison_csv('request_body_comparison.csv')
    comparator.generate_response_comparison_csv('response_comparison.csv')
    comparator.generate_property_statistics_csv('property_statistics.csv')
    
    # Generate analysis reports
    comparator.generate_type_mismatch_csv('type_mismatches.csv')
    comparator.generate_missing_properties_csv('missing_properties.csv')
    
    # Print summary report
    comparator.generate_summary_report()
    
    print("\n" + "="*60)
    print("COMPARISON COMPLETE")
    print("="*60)
    
    print("\n📁 Generated files:")
    print("\n   Endpoint Coverage:")
    print("   - path_comparison.csv (path-level comparison with methods)")
    print("   - endpoint_comparison.csv (full endpoint coverage matrix)")
    print("   - api_summary.csv (high-level comparison)")
    print("   - endpoint_details.csv (detailed endpoint list)")
    print("\n   Property Comparisons:")
    print("   - parameters_comparison.csv (parameter comparison across APIs)")
    print("   - request_body_comparison.csv (request body property comparison)")
    print("   - response_comparison.csv (response property comparison)")
    print("   - property_statistics.csv (property alignment statistics)")
    print("\n   Analysis Reports:")
    print("   - type_mismatches.csv (properties with different types across APIs)")
    print("   - missing_properties.csv (properties present in some APIs but not others)")
    print("\n" + "="*60)

if __name__ == "__main__":
    main()