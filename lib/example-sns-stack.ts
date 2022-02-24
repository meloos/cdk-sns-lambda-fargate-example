import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

import * as path from "path";

export class LambdaSnsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const topicName = "example-topic";

    const snsTopic = new Topic(this, "SNS Example Topic", {
      topicName: topicName,
      displayName: topicName,
    });

    const vpc = new Vpc(this, "SNS Example VPC", {
      maxAzs: 1,
    });

    const cluster = new Cluster(this, "SNS Example Cluster", {
      vpc: vpc,
    });

    const logging = new AwsLogDriver({
      streamPrefix: "sns-lambda-fargate-example",
    });

    const snsTaskDefinition = new FargateTaskDefinition(
      this,
      "SNS Example Task Definition",
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    snsTaskDefinition.addContainer("Example SNS Publisher", {
      containerName: "sns-publisher",
      image: ContainerImage.fromAsset(
        path.resolve(__dirname, "../src/node-sns-pub-cron")
      ),
      environment: {
        TOPIC_ARN: snsTopic.topicArn,
      },
      logging,
    });

    snsTopic.grantPublish(snsTaskDefinition.taskRole)

    new FargateService(this, "FargateService", {
      cluster,
      taskDefinition: snsTaskDefinition,
    });

    const subLambda = new NodejsFunction(this, "SNS Example Lambda", {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_14_X,
      handler: "main",
      entry: path.join(__dirname, "../src/lambda-sub/index.ts"),
    });

    snsTopic.addSubscription(new LambdaSubscription(subLambda));

    new CfnOutput(this, "SNS Example Topic arn", {
      value: snsTopic.topicArn,
      description: "Example topic arn",
    });

    // Test sns subscription:
    // aws sns publish --subject "Blah blah blah to lambda" --message "Hello lambda from cli" --topic-arn "<arn>"
  }
}
