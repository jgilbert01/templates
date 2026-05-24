#!/bin/bash
# Step 1: Deploy the EventBridge Bus, WebSocket Service, and MFE hosting
# Run this once to set up the infrastructure

set -euo pipefail

STAGE=${1:-np}
REGION=${2:-us-west-2}

SLS_PROFILE_ARGS=()
[[ -n "${AWS_PROFILE:-}" ]] && SLS_PROFILE_ARGS=(--aws-profile "$AWS_PROFILE")

trap 'echo ""; echo "✗ Deployment failed at line $LINENO. Check the output above for details." >&2' ERR

for cmd in aws npm npx; do
  command -v "$cmd" &>/dev/null || { echo "✗ Required command not found: $cmd" >&2; exit 1; }
done

DEMO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_DIR="$DEMO_DIR/../template-websocket-service"
MFE_DIR="$DEMO_DIR/../template-websocket-mfe"
STACK_NAME="template-websocket-demo-bus-${STAGE}"
BUS_NAME="$STACK_NAME"
WS_API_NAME="template-websocket-service-${STAGE}"

[[ -d "$SERVICE_DIR" ]] || { echo "✗ Directory not found: $SERVICE_DIR" >&2; exit 1; }
[[ -d "$MFE_DIR" ]] || { echo "✗ Directory not found: $MFE_DIR" >&2; exit 1; }

npx serverless --version &>/dev/null || { echo "✗ serverless framework not available via npx" >&2; exit 1; }

get_stack_status() {
  aws cloudformation describe-stacks \
    --stack-name "$1" --region "$REGION" \
    --query "Stacks[0].StackStatus" --output text 2>/dev/null || true
}

echo ""
echo "Checking AWS credentials..."
if ! AWS_IDENTITY=$(aws sts get-caller-identity --output json 2>&1); then
  echo "✗ No active AWS credentials found. Configure the AWS CLI before proceeding." >&2
  echo "  Error: $AWS_IDENTITY" >&2
  exit 1
fi
AWS_ACCOUNT=$(echo "$AWS_IDENTITY" | grep -o '"Account": *"[^"]*"' | grep -o '[0-9]*')
AWS_USER=$(echo "$AWS_IDENTITY" | grep -o '"Arn": *"[^"]*"' | cut -d'"' -f4)
echo "✓ Connected: account ${AWS_ACCOUNT}  (${AWS_USER})"

if [[ "$AWS_USER" == *":root" ]]; then
  echo "⚠ Warning: you are authenticated as the root account user."
  echo "  AWS recommends using an IAM user or SSO profile instead."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ⚠  AWS RESOURCE DEPLOYMENT WARNING                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  This script will create real AWS resources in your account."
echo ""
echo "  Account : ${AWS_ACCOUNT}"
echo "  Identity: ${AWS_USER}"
echo "  Stage   : $STAGE"
echo "  Region  : $REGION"
echo ""
echo "  Resources to be created:"
echo "    EventBridge  template-websocket-demo-bus-${STAGE}"
echo "    S3 bucket    template-websocket-demo-bus-mfe-${STAGE}"
echo "    CloudFront   distribution (*.cloudfront.net)"
echo "    API Gateway  template-websocket-service-${STAGE} (WebSocket)"
echo "    Lambda       template-websocket-service-${STAGE}-connect"
echo "    Lambda       template-websocket-service-${STAGE}-disconnect"
echo "    Lambda       template-websocket-service-${STAGE}-subscribe"
echo "    Lambda       template-websocket-service-${STAGE}-replay"
echo "    Lambda       template-websocket-service-${STAGE}-broadcast"
echo "    DynamoDB     template-websocket-service-${STAGE}-connections"
echo "    DynamoDB     template-websocket-service-${STAGE}-subscriptions"
echo "    DynamoDB     template-websocket-service-${STAGE}-events"
echo ""
echo "  ⚠  Run ./scripts/cleanup.sh when done to remove all resources."
echo ""
read -rp "  Type 'yes' to proceed, or press Enter to cancel: " confirm
echo ""
[[ "$confirm" == "yes" ]] || { echo "Cancelled."; exit 0; }

echo "=== Deploying EventBridge Bus + MFE Hosting ==="
cd "$DEMO_DIR"
npm install
BUS_STATUS=$(get_stack_status "$STACK_NAME")
case "$BUS_STATUS" in
  CREATE_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
    echo "✓ Bus stack already deployed — skipping" ;;
  *IN_PROGRESS)
    echo "⚠ Bus stack deployment in progress — skipping" ;;
  *)
    npx serverless deploy --stage $STAGE --region $REGION "${SLS_PROFILE_ARGS[@]}" ;;
esac

echo ""
echo "✓ EventBridge Bus deployed: $BUS_NAME"

echo ""
echo "=== Deploying WebSocket Service ==="
cd "$SERVICE_DIR"
npm install
SVC_STATUS=$(get_stack_status "template-websocket-service-${STAGE}")
case "$SVC_STATUS" in
  CREATE_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
    echo "✓ WebSocket Service stack already deployed — skipping" ;;
  *IN_PROGRESS)
    echo "⚠ WebSocket Service stack deployment in progress — skipping" ;;
  *)
    npx serverless deploy --stage $STAGE --region $REGION "${SLS_PROFILE_ARGS[@]}" ;;
esac

WS_URL=$(npx serverless info --stage "$STAGE" --region "$REGION" "${SLS_PROFILE_ARGS[@]}" 2>/dev/null \
  | grep -oE 'wss://[^[:space:]]+' | head -1) || true

if [[ -z "$WS_URL" ]]; then
  WS_URL=$(aws apigatewayv2 get-apis \
    --region "$REGION" \
    --output text \
    --query "Items[?Name=='${WS_API_NAME}'].ApiEndpoint" 2>/dev/null | head -1) || true
  [[ -n "$WS_URL" ]] && WS_URL="${WS_URL}/${STAGE}"
fi

[[ -n "$WS_URL" ]] || { echo "✗ Could not detect WebSocket URL — check the output above" >&2; exit 1; }
echo ""
echo "✓ WebSocket Service deployed: $WS_URL"

echo ""
echo "=== Building and Deploying MFE ==="
MFE_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='mfeBucketName'].OutputValue" \
  --output text)

CF_DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='mfeDistributionId'].OutputValue" \
  --output text)

MFE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='mfeUrl'].OutputValue" \
  --output text)

cd "$MFE_DIR"
npm install
WS_URL="$WS_URL" npm run build:standalone

if ! aws s3 sync dist/standalone "s3://${MFE_BUCKET}" --delete --region "$REGION"; then
  echo "✗ Failed to upload MFE to S3" >&2; exit 1
fi

INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" --paths "/*" \
  --query "Invalidation.Id" --output text)

echo ""
echo "Waiting for CloudFront distribution to be ready..."
echo "  (First deploy typically takes 5-7 minutes)"
while true; do
  CF_STATUS=$(aws cloudfront get-distribution \
    --id "$CF_DIST_ID" \
    --query "Distribution.Status" --output text 2>/dev/null)
  [[ "$CF_STATUS" == "Deployed" ]] && break
  printf "  Status: %-12s  (checking again in 15s)\r" "$CF_STATUS"
  sleep 15
done
echo ""
echo "✓ CloudFront distribution is live"

echo ""
echo "============================================"
echo "✓ Everything deployed!"
echo ""
echo "  WS URL:  $WS_URL"
echo "  MFE URL: $MFE_URL"
echo ""
echo "Open the MFE URL in your browser, then run:"
echo "  ./scripts/02-emit-single.sh $STAGE $REGION"
echo "============================================"
