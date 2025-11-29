# AWS Pricing Analysis: Product Image OCR Processing System

## Executive Summary

This document provides a comprehensive cost analysis for the Product Image OCR Processing System, a serverless architecture leveraging AWS Lambda, API Gateway, S3, DynamoDB, and Amazon Bedrock with Claude models for automated product specification extraction from images.

**Key Cost Drivers:**
- Amazon Bedrock Foundation Models (Claude): Primary cost component
- AWS Lambda: Compute processing
- API Gateway: REST API requests
- DynamoDB: Data storage and operations
- S3: Image storage

## Architecture Overview

The system processes product images through the following workflow:
1. Image upload via React frontend → API Gateway → Lambda
2. S3 storage triggers OCR processing Lambda
3. Bedrock Claude model extracts product specifications
4. Results stored in DynamoDB
5. Status/results retrieved via API Gateway

## Detailed Pricing Analysis

### 1. Amazon Bedrock Foundation Models (Claude)

**Service:** AmazonBedrockFoundationModels
**Primary Usage:** OCR and structured data extraction

**Key Pricing Tiers (per million tokens):**
- **Claude 3.5 Haiku (Recommended for OCR):**
  - Input tokens: $0.30 per 1M tokens
  - Output tokens: $1.50 per 1M tokens
- **Claude 3 Sonnet:**
  - Input tokens: $3.00 per 1M tokens  
  - Output tokens: $15.00 per 1M tokens
- **Claude 3.5 Sonnet:**
  - Input tokens: $3.00 per 1M tokens
  - Output tokens: $15.00 per 1M tokens

**Estimated Token Usage per Image:**
- Input tokens (image + prompt): ~2,000 tokens
- Output tokens (structured JSON): ~500 tokens

### 2. AWS Lambda

**Service:** AWSLambda
**Usage:** Three Lambda functions for upload, OCR processing, and status handling

**Pricing Structure:**
- **Requests:** $0.20 per 1M requests
- **Compute (GB-seconds):**
  - Tier 1 (0-6B GB-seconds): $0.0000166667 per GB-second
  - Tier 2 (6B-15B GB-seconds): $0.0000150000 per GB-second
  - Tier 3 (15B+ GB-seconds): $0.0000133334 per GB-second

**Function Specifications:**
- Upload Handler: 512MB, ~2 seconds execution
- OCR Processor: 1024MB, ~10 seconds execution (Bedrock calls)
- Status Handler: 256MB, ~1 second execution

### 3. Amazon API Gateway

**Service:** AmazonApiGateway
**Usage:** REST API endpoints for frontend communication

**Pricing Structure:**
- **REST API Requests:**
  - First 333M requests: $3.50 per 1M requests
  - Next 667M requests: $2.80 per 1M requests
  - Next 19B requests: $2.38 per 1M requests
  - Over 20B requests: $1.51 per 1M requests

**Expected API Calls per Image:**
- Upload request: 1 call
- Status polling: ~3-5 calls
- Results retrieval: 1 call
- Total: ~5-7 calls per image

### 4. Amazon DynamoDB

**Service:** AmazonDynamoDB
**Usage:** Job status and results storage

**On-Demand Pricing:**
- **Read Request Units:** $0.125 per 1M RRUs
- **Write Request Units:** $0.625 per 1M WRUs
- **Storage:** $0.25 per GB-month (after 25GB free tier)

**Operations per Image:**
- Write operations: 2-3 (initial job, status updates, final results)
- Read operations: 3-5 (status checks, results retrieval)

### 5. Amazon S3

**Service:** AmazonS3
**Usage:** Image storage

**Standard Storage Pricing:**
- First 50TB: $0.023 per GB-month
- Next 450TB: $0.022 per GB-month
- Over 500TB: $0.021 per GB-month

**Storage Requirements:**
- Average image size: 2-5MB
- Retention period: Configurable (30-90 days typical)

## Cost Scenarios

### Scenario 1: Low Volume (100 images/month)

**Monthly Costs:**
- **Bedrock (Claude 3.5 Haiku):**
  - Input: 100 × 2,000 tokens = 200K tokens = $0.06
  - Output: 100 × 500 tokens = 50K tokens = $0.08
  - Subtotal: $0.14

- **Lambda:**
  - Requests: 300 requests = $0.00006
  - Compute: ~0.5 GB-seconds per image × 100 = 50 GB-seconds = $0.0008
  - Subtotal: $0.0009

- **API Gateway:**
  - Requests: 600 requests = $0.002
  - Subtotal: $0.002

- **DynamoDB:**
  - Writes: 250 WRUs = $0.0002
  - Reads: 400 RRUs = $0.00005
  - Storage: <1GB (free tier)
  - Subtotal: $0.0003

- **S3:**
  - Storage: 0.3GB × $0.023 = $0.007
  - Subtotal: $0.007

**Total Monthly Cost: $0.15**

### Scenario 2: Medium Volume (1,000 images/month)

**Monthly Costs:**
- **Bedrock (Claude 3.5 Haiku):**
  - Input: 1,000 × 2,000 tokens = 2M tokens = $0.60
  - Output: 1,000 × 500 tokens = 500K tokens = $0.75
  - Subtotal: $1.35

- **Lambda:**
  - Requests: 3,000 requests = $0.0006
  - Compute: 500 GB-seconds = $0.008
  - Subtotal: $0.009

- **API Gateway:**
  - Requests: 6,000 requests = $0.021
  - Subtotal: $0.021

- **DynamoDB:**
  - Writes: 2,500 WRUs = $0.002
  - Reads: 4,000 RRUs = $0.0005
  - Storage: 2GB × $0.25 = $0.50
  - Subtotal: $0.503

- **S3:**
  - Storage: 3GB × $0.023 = $0.069
  - Subtotal: $0.069

**Total Monthly Cost: $1.95**

### Scenario 3: High Volume (10,000 images/month)

**Monthly Costs:**
- **Bedrock (Claude 3.5 Haiku):**
  - Input: 10,000 × 2,000 tokens = 20M tokens = $6.00
  - Output: 10,000 × 500 tokens = 5M tokens = $7.50
  - Subtotal: $13.50

- **Lambda:**
  - Requests: 30,000 requests = $0.006
  - Compute: 5,000 GB-seconds = $0.083
  - Subtotal: $0.089

- **API Gateway:**
  - Requests: 60,000 requests = $0.21
  - Subtotal: $0.21

- **DynamoDB:**
  - Writes: 25,000 WRUs = $0.016
  - Reads: 40,000 RRUs = $0.005
  - Storage: 15GB × $0.25 = $3.75
  - Subtotal: $3.77

- **S3:**
  - Storage: 30GB × $0.023 = $0.69
  - Subtotal: $0.69

**Total Monthly Cost: $18.26**

### Scenario 4: Enterprise Volume (100,000 images/month)

**Monthly Costs:**
- **Bedrock (Claude 3.5 Haiku):**
  - Input: 100,000 × 2,000 tokens = 200M tokens = $60.00
  - Output: 100,000 × 500 tokens = 50M tokens = $75.00
  - Subtotal: $135.00

- **Lambda:**
  - Requests: 300,000 requests = $0.06
  - Compute: 50,000 GB-seconds = $0.83
  - Subtotal: $0.89

- **API Gateway:**
  - Requests: 600,000 requests = $2.10
  - Subtotal: $2.10

- **DynamoDB:**
  - Writes: 250,000 WRUs = $0.16
  - Reads: 400,000 RRUs = $0.05
  - Storage: 120GB × $0.25 = $30.00
  - Subtotal: $30.21

- **S3:**
  - Storage: 300GB × $0.023 = $6.90
  - Subtotal: $6.90

**Total Monthly Cost: $175.10**

## Cost Optimization Recommendations

### 1. Model Selection
- **Use Claude 3.5 Haiku** for OCR tasks (most cost-effective)
- Consider batch processing for high volumes
- Implement prompt caching for repeated contexts

### 2. Lambda Optimization
- Right-size memory allocation based on actual usage
- Implement connection pooling for DynamoDB
- Use ARM-based Lambda for 20% cost savings

### 3. Storage Optimization
- Implement S3 lifecycle policies for automatic cleanup
- Use S3 Intelligent Tiering for long-term storage
- Compress images before processing if quality allows

### 4. DynamoDB Optimization
- Use on-demand billing for variable workloads
- Implement TTL for automatic data cleanup
- Consider reserved capacity for predictable workloads

### 5. API Gateway Optimization
- Implement caching for frequently accessed data
- Use HTTP API instead of REST API for 70% cost savings
- Implement request batching where possible

## Free Tier Benefits

**First 12 Months:**
- Lambda: 1M requests + 400,000 GB-seconds free
- DynamoDB: 25GB storage + 25 RCU + 25 WCU free
- API Gateway: 1M REST API calls free
- S3: 5GB standard storage free

**Always Free:**
- DynamoDB: 25GB storage + 25 RCU + 25 WCU
- Lambda: 1M requests + 400,000 GB-seconds monthly

## Cost Summary by Volume

| Volume | Monthly Images | Total Cost | Cost per Image |
|--------|---------------|------------|----------------|
| Low | 100 | $0.15 | $0.0015 |
| Medium | 1,000 | $1.95 | $0.00195 |
| High | 10,000 | $18.26 | $0.00183 |
| Enterprise | 100,000 | $175.10 | $0.00175 |

## Key Assumptions

1. **Image Processing:**
   - Average image size: 2-5MB
   - Processing time: 8-12 seconds per image
   - Token usage: 2,000 input + 500 output tokens

2. **Usage Patterns:**
   - 5-7 API calls per image processing workflow
   - 2-3 DynamoDB write operations per image
   - 3-5 DynamoDB read operations per image

3. **Storage:**
   - 30-day retention period for processed images
   - JSON results stored indefinitely in DynamoDB

4. **Model Selection:**
   - Claude 3.5 Haiku recommended for cost optimization
   - Standard on-demand pricing (no reserved capacity)

## Conclusion

The Product Image OCR Processing System offers excellent cost efficiency, with per-image costs ranging from $0.0015 to $0.00195 depending on volume. Amazon Bedrock represents 85-90% of total costs, making model selection and optimization critical for cost management.

The serverless architecture provides automatic scaling and pay-per-use pricing, making it ideal for variable workloads. The system becomes more cost-effective at higher volumes due to economies of scale in the pricing tiers.

For production deployments, implementing the recommended optimizations can reduce costs by 20-30% while maintaining performance and reliability.
