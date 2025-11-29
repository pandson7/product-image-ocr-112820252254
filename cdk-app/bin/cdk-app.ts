#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProductOcrStack } from '../lib/product-ocr-stack';

const app = new cdk.App();
new ProductOcrStack(app, 'ProductOcrStack112820252254', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});
