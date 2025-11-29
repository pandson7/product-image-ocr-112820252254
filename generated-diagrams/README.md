# Product Image OCR Processing System - Architecture Diagrams

## Overview
This directory contains AWS architecture diagrams for the Product Image OCR Processing System, generated based on the technical design specifications.

## Generated Diagrams

### 1. Main Architecture (`main_architecture.png`)
- **Purpose**: High-level system overview showing all major components
- **Components**: React frontend, API Gateway, Lambda functions, S3, DynamoDB, Bedrock, CloudWatch
- **Flow**: User interaction through React app to serverless backend processing

### 2. Data Flow (`data_flow.png`)
- **Purpose**: Detailed step-by-step data flow through the system
- **Shows**: 17-step process from image upload to results display
- **Key Flows**: Upload → Storage → OCR Processing → Results → Status Polling

### 3. Security & IAM (`security_iam.png`)
- **Purpose**: Security architecture and IAM role permissions
- **Components**: Lambda execution roles and their specific permissions
- **Permissions**: S3 access, DynamoDB operations, Bedrock model invocation, CloudWatch logging

### 4. Deployment Architecture (`deployment_architecture.png`)
- **Purpose**: Infrastructure deployment using AWS CDK
- **Shows**: CDK stacks and their deployed resources
- **Structure**: Storage, Compute, API, and IAM stacks

## Key Architecture Decisions

### Technology Stack
- **Frontend**: React with local development server (no CloudFront)
- **API**: AWS API Gateway with REST endpoints
- **Compute**: AWS Lambda functions (Node.js 18.x)
- **Storage**: Amazon S3 for images, DynamoDB for structured data
- **AI/ML**: Amazon Bedrock with Claude model for OCR
- **Monitoring**: CloudWatch for logs and metrics

### Security Features
- IAM roles with least privilege access
- CORS configuration for frontend integration
- Request validation and sanitization
- Structured error handling

### Scalability
- Serverless architecture with automatic scaling
- Event-driven processing with S3 triggers
- DynamoDB on-demand pricing model
- Lambda concurrent execution handling

## File Locations
All diagrams are saved as PNG files in this directory:
- `/home/pandson/echo-architect-artifacts/product-image-ocr-112820252254/generated-diagrams/generated-diagrams/`

## Design Compliance
- ✅ Uses DynamoDB as backend data store
- ✅ No SageMaker, CloudFront, Amplify, or Cognito
- ✅ No authentication (prototype system)
- ✅ React frontend instead of CloudFront
- ✅ Excludes Amazon Forecast service
- ✅ Serverless architecture with AWS Lambda
