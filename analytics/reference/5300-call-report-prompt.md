# Prompt for LLM Analysis of NCUA 5300 Call Report

Analyze the attached NCUA Form 5300 Call Report (March 2025 version) and extract comprehensive technical requirements for designing a real-time banking core reporting API. Focus on the following dimensions:

## 1. Data Structure Requirements
- Identify all account codes (e.g., AS0009, 025B, 940, etc.) and their hierarchical relationships
- Map the calculation dependencies between fields (e.g., which fields sum to create totals)
- Document all conditional logic (e.g., "Complete if Account 010 > $500M")
- Extract validation rules and cross-schedule references

## 2. Reporting Schedules & Sections
For each schedule (A through I) and section, document:
- Purpose and scope
- Trigger conditions for completion
- Required data granularity (e.g., loan-level vs. aggregate)
- Temporal requirements (YTD, quarter-end, point-in-time)

## 3. Data Domain Categories
Organize requirements by domain:
- **Assets**: Cash, investments, loans, other assets
- **Liabilities**: Shares, deposits, borrowings
- **Equity**: Undivided earnings, reserves, net income
- **Income/Expense**: Interest income, fees, operating expenses
- **Off-Balance Sheet**: Commitments, derivatives, contingent liabilities
- **Capital Adequacy**: Net worth, risk-based capital calculations

## 4. Real-Time Computation Requirements
Identify:
- Fields requiring real-time calculation vs. batch processing
- Complex calculations (e.g., risk-weighted assets, maturity distributions)
- Aggregations that could be pre-computed vs. on-demand
- Dependencies on external data (e.g., NCUSIF rates, FRB data)

## 5. API Design Implications
Extract requirements for:
- **Data Models**: Core entities needed (loans, shares, investments, etc.)
- **Endpoints**: Logical API groupings (e.g., /statements, /schedules/loans, /capital-adequacy)
- **Query Patterns**: Time-range queries, aggregations, drill-downs
- **Event Sourcing**: Transaction events that trigger report updates
- **Access Patterns**: Which reports need member-level vs. institutional-level data

## 6. Compliance & Validation Rules
Document:
- Required fields vs. conditional fields
- Cross-field validation rules (e.g., Account 010 must equal Account 014)
- Business rules (e.g., CECL adoption impacts multiple calculations)
- Regulatory thresholds (e.g., $500M threshold for Schedule I)

## 7. Temporal & Historical Requirements
Identify:
- Point-in-time snapshots needed (quarter-end balances)
- Period calculations (YTD, quarterly averages)
- Historical comparison requirements (e.g., "prior quarter" references)
- Audit trail requirements (e.g., corrections to submitted reports)

## 8. Dimensional Analysis
For loan and investment portfolios, document required dimensions:
- **Loan categorization**: Commercial vs. consumer, secured vs. unsecured, real estate types
- **Maturity buckets**: <1 year, 1-3 years, 3-5 years, 5-10 years, >10 years
- **Delinquency aging**: 30-59, 60-89, 90-179, 180-359, >=360 days
- **Risk weights**: 0%, 20%, 50%, 75%, 100%, 150%, 250%, 300%, 400%, 1250%

## 9. Performance Considerations
Assess computational complexity:
- Which calculations are O(1) lookups vs. require full portfolio scans
- Opportunities for materialized views or cached aggregations
- Potential bottlenecks in real-time computation
- Trade-offs between storage and compute for pre-aggregation

## 10. Integration Points
Identify external data dependencies:
- NCUA systems (e.g., NCUSIF deposit calculations)
- Federal Reserve data (e.g., PPP loans, Fed borrowings)
- Third-party systems (e.g., CUSOs, service organizations)
- Market data (e.g., fair value calculations for securities)

## Output Format
Provide a structured document with:
1. **Entity Relationship Diagram** (in Mermaid syntax) showing core entities
2. **Field Catalog** with account codes, data types, and dependencies
3. **API Endpoint Specifications** (pseudo-OpenAPI format)
4. **Calculation Engine Requirements** for complex formulas
5. **Data Pipeline Architecture** recommendations
6. **Prioritized Implementation Roadmap** (MVP vs. advanced features)

## Special Considerations for BaaS Context
Since this is for a Banking-as-a-Service platform:
- Distinguish between single-institution reporting vs. multi-tenant aggregation
- Consider how to expose partial report generation to BaaS customers
- Identify white-label customization requirements
- Address data residency and compliance for multi-state operations