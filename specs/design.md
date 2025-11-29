# Design Document

## Introduction

This document outlines the technical architecture and design decisions for the Product Image OCR Processing System. The system leverages AWS serverless services to provide a scalable, cost-effective solution for automated product specification extraction from images.

## System Architecture

### High-Level Architecture

The system follows an event-driven serverless architecture with the following key components:

1. **Frontend Layer**: React application for user interaction
2. **API Layer**: AWS API Gateway for REST endpoints
3. **Processing Layer**: AWS Lambda functions for business logic
4. **Storage Layer**: Amazon S3 for images, DynamoDB for structured data
5. **AI/ML Layer**: Amazon Bedrock with Claude model for OCR and data extraction

### Component Interactions

```
User → React Frontend → API Gateway → Lambda Functions → S3/Bedrock/DynamoDB
                                   ↓
                              S3 Event Trigger → Lambda → Bedrock → DynamoDB
```

## Detailed Component Design

### 1. Frontend Application (React)

**Technology Stack:**
- React 18+ with functional components and hooks
- Axios for HTTP requests
- Material-UI or similar for UI components
- Local development server (no CloudFront)

**Key Features:**
- Drag-and-drop file upload interface
- Real-time processing status updates
- Structured display of extracted product data
- Error handling and user feedback

**API Integration:**
- Upload endpoint: POST /api/upload
- Status endpoint: GET /api/status/{id}
- Results endpoint: GET /api/results/{id}

### 2. API Gateway

**Configuration:**
- REST API with CORS enabled
- Request/response validation
- Integration with Lambda functions
- Error handling and status codes

**Endpoints:**
- POST /upload - Image upload and processing initiation
- GET /status/{id} - Processing status check
- GET /results/{id} - Retrieve extracted data
- GET /health - Health check endpoint

### 3. Lambda Functions

#### Upload Handler Function
**Runtime:** Node.js 18.x
**Purpose:** Handle image uploads and initiate processing
**Triggers:** API Gateway POST /upload
**Permissions:** S3 write, DynamoDB write

**Functionality:**
- Validate uploaded file format and size
- Generate unique identifier for processing job
- Upload image to S3 with metadata
- Create initial record in DynamoDB
- Return job ID to client

#### OCR Processing Function
**Runtime:** Node.js 18.x
**Purpose:** Process images and extract product data
**Triggers:** S3 object creation event
**Permissions:** S3 read, Bedrock invoke, DynamoDB write

**Functionality:**
- Retrieve image from S3
- Call Bedrock Claude model for OCR and data extraction
- Parse and validate extracted JSON data
- Update DynamoDB with results and status

#### Status/Results Handler Function
**Runtime:** Node.js 18.x
**Purpose:** Provide processing status and results
**Triggers:** API Gateway GET requests
**Permissions:** DynamoDB read

**Functionality:**
- Query DynamoDB for job status
- Return processing status or extracted data
- Handle error cases and missing records

### 4. Storage Services

#### Amazon S3
**Bucket Configuration:**
- Single bucket for image storage
- Lifecycle policies for cleanup
- Event notifications to trigger processing
- Appropriate IAM policies for Lambda access

**Object Structure:**
```
product-images/
├── {job-id}/
│   └── original.{ext}
```

#### DynamoDB
**Table Design:**
- Table Name: ProductOCRJobs
- Partition Key: jobId (String)
- Attributes:
  - jobId: Unique identifier
  - status: processing|completed|failed
  - imageUrl: S3 object reference
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - extractedData: JSON object with product specifications
  - errorMessage: Error details if processing fails

**Sample Record:**
```json
{
  "jobId": "uuid-string",
  "status": "completed",
  "imageUrl": "s3://bucket/product-images/uuid/original.jpg",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:01:30Z",
  "extractedData": {
    "productName": "Sample Product",
    "brand": "Brand Name",
    "category": "Electronics",
    "price": "$99.99",
    "dimensions": "10x5x2 inches",
    "weight": "1.5 lbs",
    "description": "Product description text"
  }
}
```

### 5. AI/ML Integration

#### Amazon Bedrock with Claude
**Model:** Claude 3 Sonnet or Claude 3.5 Sonnet
**Usage:** OCR processing and structured data extraction

**Prompt Strategy:**
```
Analyze this product image and extract the following information in JSON format:
- productName: The name of the product
- brand: The brand or manufacturer
- category: Product category
- price: Listed price if visible
- dimensions: Physical dimensions if shown
- weight: Product weight if listed
- description: Any product description text
- additionalDetails: Any other visible product specifications

Return only valid JSON. If information is not visible, use null for that field.
```

## Security Design

### IAM Roles and Policies

#### Lambda Execution Roles
- **Upload Handler Role:**
  - S3: PutObject on specific bucket
  - DynamoDB: PutItem, UpdateItem on ProductOCRJobs table
  - CloudWatch: Logs permissions

- **OCR Processing Role:**
  - S3: GetObject on specific bucket
  - Bedrock: InvokeModel for Claude
  - DynamoDB: PutItem, UpdateItem on ProductOCRJobs table
  - CloudWatch: Logs permissions

- **Status Handler Role:**
  - DynamoDB: GetItem, Query on ProductOCRJobs table
  - CloudWatch: Logs permissions

### API Security
- CORS configuration for frontend domain
- Request validation and sanitization
- Rate limiting considerations
- Input validation for file uploads

## Deployment Architecture

### Infrastructure as Code (CDK)
**Technology:** AWS CDK with TypeScript
**Structure:**
```
cdk-app/
├── lib/
│   ├── storage-stack.ts      # S3 and DynamoDB
│   ├── compute-stack.ts      # Lambda functions
│   ├── api-stack.ts          # API Gateway
│   └── iam-stack.ts          # IAM roles and policies
├── lambda/
│   ├── upload-handler/
│   ├── ocr-processor/
│   └── status-handler/
└── app.ts
```

### Environment Configuration
- Development: Single region deployment
- No CI/CD pipeline (simple CDK deployment)
- Environment variables for configuration
- Local frontend development server

## Data Flow Design

### Upload and Processing Flow
1. User uploads image via React frontend
2. Frontend calls API Gateway POST /upload
3. Upload Lambda validates file and stores in S3
4. S3 event triggers OCR Processing Lambda
5. Lambda retrieves image and calls Bedrock Claude
6. Extracted data is stored in DynamoDB
7. Frontend polls status endpoint for completion
8. Results are displayed to user

### Error Handling Flow
- File validation errors: Immediate response to frontend
- Processing errors: Logged and status updated in DynamoDB
- Service errors: Retry logic with exponential backoff
- User notification: Clear error messages in frontend

## Performance Considerations

### Scalability
- Serverless architecture scales automatically
- DynamoDB on-demand pricing for variable workloads
- S3 handles unlimited storage requirements
- Lambda concurrent execution limits

### Optimization
- Image size validation to control processing time
- Efficient JSON parsing and validation
- Minimal Lambda cold start impact
- Appropriate timeout configurations

## Monitoring and Observability

### CloudWatch Integration
- Lambda function logs and metrics
- API Gateway access logs and metrics
- Custom metrics for processing success/failure rates
- Alarms for error rates and performance

### Debugging Support
- Structured logging in Lambda functions
- Request tracing through API Gateway
- Error details stored in DynamoDB
- Frontend error reporting

## Testing Strategy

### Unit Testing
- Lambda function logic testing
- Data validation and parsing tests
- Error handling scenarios

### Integration Testing
- End-to-end API testing
- S3 event trigger validation
- Bedrock integration testing
- DynamoDB operations testing

### User Acceptance Testing
- Frontend functionality validation
- Real image processing with sample data
- Complete user workflow testing
- Performance and reliability validation
