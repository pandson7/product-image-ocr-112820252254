import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export class ProductOcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const suffix = '112820252254';

    // S3 Bucket for image storage
    const imageBucket = new s3.Bucket(this, `ProductImageBucket${suffix}`, {
      bucketName: `product-images-${suffix}`,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB Table for job tracking
    const jobsTable = new dynamodb.Table(this, `ProductOcrJobs${suffix}`, {
      tableName: `ProductOcrJobs${suffix}`,
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Enable auto scaling
    jobsTable.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });
    jobsTable.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });

    // Upload Handler Lambda
    const uploadHandler = new lambda.Function(this, `UploadHandler${suffix}`, {
      functionName: `upload-handler-${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/upload-handler'),
      environment: {
        BUCKET_NAME: imageBucket.bucketName,
        TABLE_NAME: jobsTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // OCR Processor Lambda
    const ocrProcessor = new lambda.Function(this, `OcrProcessor${suffix}`, {
      functionName: `ocr-processor-${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/ocr-processor'),
      environment: {
        BUCKET_NAME: imageBucket.bucketName,
        TABLE_NAME: jobsTable.tableName,
      },
      timeout: cdk.Duration.seconds(300),
    });

    // Status Handler Lambda
    const statusHandler = new lambda.Function(this, `StatusHandler${suffix}`, {
      functionName: `status-handler-${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/status-handler'),
      environment: {
        TABLE_NAME: jobsTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // IAM Permissions
    imageBucket.grantReadWrite(uploadHandler);
    imageBucket.grantRead(ocrProcessor);
    jobsTable.grantReadWriteData(uploadHandler);
    jobsTable.grantReadWriteData(ocrProcessor);
    jobsTable.grantReadData(statusHandler);

    // Bedrock permissions for OCR processor
    ocrProcessor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/global.anthropic.claude-sonnet-4-20250514-v1:0`,
        `arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-20250514-v1:0`
      ],
    }));

    // S3 Event Notification
    imageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(ocrProcessor)
    );

    // API Gateway
    const api = new apigateway.RestApi(this, `ProductOcrApi${suffix}`, {
      restApiName: `product-ocr-api-${suffix}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // API Endpoints
    const uploadIntegration = new apigateway.LambdaIntegration(uploadHandler);
    const statusIntegration = new apigateway.LambdaIntegration(statusHandler);

    api.root.addResource('upload').addMethod('POST', uploadIntegration);
    const statusResource = api.root.addResource('status');
    statusResource.addResource('{id}').addMethod('GET', statusIntegration);
    const resultsResource = api.root.addResource('results');
    resultsResource.addResource('{id}').addMethod('GET', statusIntegration);

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: imageBucket.bucketName,
      description: 'S3 Bucket Name',
    });
  }
}
