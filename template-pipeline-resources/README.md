# template-pipeline-resources

This project manages the AWS permissions and resources required to create and update cloudformation stacks from CICD pipelines. 

## Stack Setup
1. Deploy initially with deploymentBucket and deploymentRole commented out
2. Manually empty default serverless deployment bucket
3. Redeploy with deploymentBucket and deploymentRole uncommented
