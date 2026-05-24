#!/bin/bash
# Step 6: Cleanup — remove all deployed resources

set -e

STAGE=${1:-np}
REGION=${2:-us-west-2}

SLS_PROFILE_ARGS=()
[[ -n "${AWS_PROFILE:-}" ]] && SLS_PROFILE_ARGS=(--aws-profile "$AWS_PROFILE")

STACK_NAME="template-websocket-demo-bus-${STAGE}"
SVC_STACK_NAME="template-websocket-service-${STAGE}"

stack_exists() {
  aws cloudformation describe-stacks --stack-name "$1" --region "$REGION" \
    --query "Stacks[0].StackStatus" --output text 2>/dev/null | grep -qvE '^$|DELETE_COMPLETE'
}

resource_check() {
  local label="$1"
  local exists="$2"
  if [[ "$exists" == "false" ]]; then
    echo "  ✓ $label"
  else
    echo "  ✗ $label  ← still exists"
    CLEANUP_FAILED=1
  fi
}

echo "=== Removing WebSocket Service ==="
cd "$(dirname "$0")/../../template-websocket-service"
npx serverless remove --stage $STAGE --region $REGION "${SLS_PROFILE_ARGS[@]}" || true

echo ""
echo "=== Emptying MFE S3 Bucket ==="
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='mfeBucketName'].OutputValue" \
  --output text 2>/dev/null) || true

if [[ -n "$BUCKET" && "$BUCKET" != "None" ]]; then
  aws s3 rm "s3://${BUCKET}" --recursive --region "$REGION"
  echo "✓ MFE bucket emptied"
fi

echo ""
echo "=== Purging EventBridge Rules ==="
bus_name="template-websocket-demo-bus-${STAGE}"
rules=$(aws events list-rules --event-bus-name "$bus_name" --region "$REGION" \
  --query "Rules[].Name" --output text 2>/dev/null) || true
if [[ -n "$rules" && "$rules" != "None" ]]; then
  for rule in $rules; do
    targets=$(aws events list-targets-by-rule --rule "$rule" --event-bus-name "$bus_name" \
      --region "$REGION" --query "Targets[].Id" --output text 2>/dev/null) || true
    if [[ -n "$targets" && "$targets" != "None" ]]; then
      # shellcheck disable=SC2086
      aws events remove-targets --rule "$rule" --event-bus-name "$bus_name" \
        --region "$REGION" --ids $targets > /dev/null
    fi
    aws events delete-rule --name "$rule" --event-bus-name "$bus_name" \
      --region "$REGION" && echo "  ✓ Deleted rule: $rule" || true
  done
else
  echo "  (no rules found)"
fi

echo ""
echo "=== Removing EventBridge Bus ==="
cd "$(dirname "$0")/.."
npm install --silent
"$(pwd)/node_modules/.bin/serverless" remove --stage $STAGE --region $REGION "${SLS_PROFILE_ARGS[@]}" || true

# ─── Verification ─────────────────────────────────────────────────────────────

echo ""
echo "=== Verifying cleanup ==="
CLEANUP_FAILED=0

# CloudFormation stacks
if stack_exists "$SVC_STACK_NAME"; then svc_gone="false"; else svc_gone="true"; fi
if stack_exists "$STACK_NAME"; then bus_gone="false"; else bus_gone="true"; fi
resource_check "CloudFormation stack: $SVC_STACK_NAME" "$svc_gone"
resource_check "CloudFormation stack: $STACK_NAME"     "$bus_gone"

# DynamoDB tables
for table in connections subscriptions events; do
  tbl_name="template-websocket-service-${STAGE}-${table}"
  exists=$(aws dynamodb describe-table --table-name "$tbl_name" --region "$REGION" \
    --query "Table.TableName" --output text 2>/dev/null) || true
  [[ -z "$exists" || "$exists" == "None" ]] && gone="true" || gone="false"
  resource_check "DynamoDB table:         $tbl_name" "$gone"
done

# S3 bucket
if [[ -n "$BUCKET" && "$BUCKET" != "None" ]]; then
  bkt_exists=$(aws s3api head-bucket --bucket "$BUCKET" --region "$REGION" 2>/dev/null && echo yes || echo no)
  [[ "$bkt_exists" == "no" ]] && bkt_gone="true" || bkt_gone="false"
  resource_check "S3 bucket:              $BUCKET" "$bkt_gone"
fi

# EventBridge bus
bus_name="template-websocket-demo-bus-${STAGE}"
eb_exists=$(aws events describe-event-bus --name "$bus_name" --region "$REGION" \
  --query "Name" --output text 2>/dev/null) || true
[[ -z "$eb_exists" || "$eb_exists" == "None" ]] && eb_gone="true" || eb_gone="false"
resource_check "EventBridge bus:        $bus_name" "$eb_gone"

# WebSocket API
api_exists=$(aws apigatewayv2 get-apis --region "$REGION" \
  --query "Items[?Name=='template-websocket-service-${STAGE}'].ApiId" \
  --output text 2>/dev/null) || true
[[ -z "$api_exists" || "$api_exists" == "None" ]] && api_gone="true" || api_gone="false"
resource_check "API Gateway (WebSocket): template-websocket-service-${STAGE}" "$api_gone"

echo ""
if [[ $CLEANUP_FAILED -eq 0 ]]; then
  echo "✓ All resources confirmed removed."
else
  echo "✗ Some resources were not removed — see above."
  echo "  You may need to delete them manually in the AWS Console."
  echo "  Region: $REGION  |  Stage: $STAGE"
  exit 1
fi
