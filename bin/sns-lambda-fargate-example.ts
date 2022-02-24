#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaSnsStack } from '../lib/example-sns-stack';

const app = new cdk.App();
new LambdaSnsStack(app, 'LambdaSnsStack', {});