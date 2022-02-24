const snsPublish = require('aws-sns-publish');
const cron = require('node-cron');

const topicArn = process.env.TOPIC_ARN

cron.schedule('* * * * *', () => {
    console.log('publishing to sns on every minute schedule');
    snsPublish('Hello from node-cron', { arn: topicArn }).then(messageId => {
        console.log(`sns msg id: ${messageId}`);
    });
});
