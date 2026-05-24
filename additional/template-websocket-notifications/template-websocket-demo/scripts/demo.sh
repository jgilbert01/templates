#!/bin/bash
# Interactive demo runner — combines scripts 01–06 into a single menu-driven tool

set -eo pipefail

STAGE="${1:-np}"
REGION="${2:-us-west-2}"

SLS_PROFILE_ARGS=()
[[ -n "${AWS_PROFILE:-}" ]] && SLS_PROFILE_ARGS=(--aws-profile "$AWS_PROFILE")

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEMO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_DIR="$SCRIPT_DIR/../../template-websocket-service"
MFE_DIR="$SCRIPT_DIR/../../template-websocket-mfe"
EMIT_SCRIPT="$DEMO_DIR/src/emit.js"
BUS_NAME="template-websocket-demo-bus-${STAGE}"
STACK_NAME="template-websocket-demo-bus-${STAGE}"
WS_API_NAME="template-websocket-service-${STAGE}"
WS_URL="(not deployed yet)"
MFE_URL="(not deployed yet)"
AWS_ACCOUNT=""
AWS_USER=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ─── Preflight ────────────────────────────────────────────────────────────────

preflight() {
  local errors=0

  for cmd in aws node npm npx; do
    command -v "$cmd" &>/dev/null || {
      echo -e "${RED}✗ Required command not found: ${cmd}${RESET}" >&2
      errors=1
    }
  done

  if aws --version 2>&1 | grep -q "aws-cli/1\."; then
    echo -e "${YELLOW}⚠ Warning: AWS CLI v1 detected. This demo is designed for AWS CLI v2, and some features may not work correctly.${RESET}" >&2
    echo -e "${DIM}  Please upgrade to AWS CLI v2 for the best experience.${RESET}" >&2
    errors=1
  fi

  local node_version
  node_version=$(node -v 2>/dev/null | grep -oE '[0-9]+' | head -1) || true
  if [[ -z "$node_version" || "$node_version" -lt 22 ]]; then
    echo -e "${YELLOW}⚠ Warning: Node.js version 22 or higher is recommended for this demo. Detected version: ${node_version}${RESET}" >&2
    echo -e "${DIM}  Some features may not work correctly with older Node.js versions.${RESET}" >&2
    errors=1
  fi

  [[ -d "$SERVICE_DIR" ]] || {
    echo -e "${RED}✗ Directory not found: ${SERVICE_DIR}${RESET}" >&2
    errors=1
  }

  [[ -f "$EMIT_SCRIPT" ]] || {
    echo -e "${RED}✗ Emit script not found: ${EMIT_SCRIPT}${RESET}" >&2
    errors=1
  }

  [[ $errors -eq 0 ]] || exit 1

  echo -e "Checking AWS credentials..."
  local identity
  if ! identity=$(aws sts get-caller-identity --output json 2>&1); then
    echo -e "${RED}✗ No active AWS credentials found. Configure the AWS CLI before proceeding.${RESET}" >&2
    echo -e "${DIM}  Error: ${identity}${RESET}" >&2
    exit 1
  fi
  AWS_ACCOUNT=$(echo "$identity" | grep -o '"Account": *"[^"]*"' | grep -o '[0-9]*')
  AWS_USER=$(echo "$identity" | grep -o '"Arn": *"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Connected: account ${AWS_ACCOUNT}${RESET}  ${DIM}(${AWS_USER})${RESET}"

  if [[ "$AWS_USER" == *":root" ]]; then
    echo -e "${YELLOW}⚠ Warning: you are authenticated as the root account user.${RESET}"
    echo -e "${DIM}  AWS recommends using an IAM user or SSO profile instead.${RESET}"
  fi

  echo -e "Checking for existing deployment..."
  local cf_url ws_url
  cf_url=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='mfeUrl'].OutputValue" \
    --output text 2>/dev/null) || true
  ws_url=$(aws apigatewayv2 get-apis \
    --region "$REGION" --output text \
    --query "Items[?Name=='${WS_API_NAME}'].ApiEndpoint" 2>/dev/null | head -1) || true
  [[ -n "$ws_url" && "$ws_url" != "None" ]] && WS_URL="${ws_url}/${STAGE}"
  [[ -n "$cf_url" && "$cf_url" != "None" ]] && MFE_URL="$cf_url"
  if [[ "$WS_URL" != "(not deployed yet)" ]]; then
    echo -e "${GREEN}✓ Existing deployment detected${RESET}"
  else
    echo -e "${DIM}  No existing deployment found${RESET}"
  fi
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

print_header() {
  printf '\033[H\033[2J'
  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}║     WebSocket Notifications Demo         ║${RESET}"
  echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
  echo ""
  echo -e "   Stage:  ${CYAN}${STAGE}${RESET}  │  Region: ${CYAN}${REGION}${RESET}"
  echo -e "   WS URL: ${CYAN}${WS_URL}${RESET}"
  echo -e "   MFE:    ${CYAN}${MFE_URL}${RESET}"
  echo ""
}

print_menu() {
  echo -e "   ${YELLOW}${BOLD}0)${RESET}${YELLOW} Deploy infrastructure${RESET}"
  echo -e "   ${DIM}──────────────────────────────────────${RESET}"
  echo -e "   ${BOLD}1) Emit single event${RESET}"
  echo -e "   ${BOLD}2) Emit burst (5 events)${RESET}"
  echo -e "   ${BOLD}3) Demo per-client filtering${RESET}"
  echo -e "   ${BOLD}4) Demo missed-event replay${RESET}"
  echo -e "   ${DIM}──────────────────────────────────────${RESET}"
  echo -e "   ${RED}${BOLD}9)${RESET}${RED} Remove all deployed resources${RESET}"
  echo -e "   ${DIM}──────────────────────────────────────${RESET}"
  echo -e "   ${CYAN}q) Quit${RESET}"
  echo ""
}

require_deployed() {
  if [[ "$WS_URL" == "(not deployed yet)" ]]; then
    echo -e "${YELLOW}⚠  Infrastructure not deployed. Run option 0 first.${RESET}"
    echo ""
    read -rp "   Press Enter to return to menu..."
    return 1
  fi
}

get_stack_status() {
  aws cloudformation describe-stacks \
    --stack-name "$1" --region "$REGION" \
    --query "Stacks[0].StackStatus" --output text 2>/dev/null || true
}

emit_event() {
  local type="$1"
  local data="$2"
  node "$EMIT_SCRIPT" \
    --bus "$BUS_NAME" \
    --type "$type" \
    --region "$REGION" \
    --data "$data"
}

pause() {
  echo ""
  read -rp "   Press Enter to return to menu..."
}

# ─── Actions ──────────────────────────────────────────────────────────────────

action_deploy() {
  print_header
  echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}║  ${YELLOW}⚠  AWS RESOURCE DEPLOYMENT WARNING${RESET}${BOLD}                          ║${RESET}"
  echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"
  echo ""
  echo "  This will create real AWS resources in your account."
  echo ""
  echo -e "  Account : ${CYAN}${AWS_ACCOUNT}${RESET}"
  echo -e "  Identity: ${CYAN}${AWS_USER}${RESET}"
  echo -e "  Stage   : ${CYAN}${STAGE}${RESET}  │  Region: ${CYAN}${REGION}${RESET}"
  echo ""
  echo "  Resources to be created:"
  echo "    EventBridge  template-websocket-demo-bus-${STAGE}"
  echo "    S3 bucket    template-websocket-demo-bus-mfe-${STAGE}"
  echo "    CloudFront   distribution (*.cloudfront.net)"
  echo "    API Gateway  template-websocket-service-${STAGE} (WebSocket)"
  echo "    Lambda ×5    template-websocket-service-${STAGE}-{connect,disconnect,subscribe,replay,broadcast}"
  echo "    DynamoDB ×3  template-websocket-service-${STAGE}-{connections,subscriptions,events}"
  echo ""
  echo -e "  ${YELLOW}⚠  Select option 9 when done to remove all resources.${RESET}"
  echo ""
  read -rp "  Type 'yes' to proceed, or press Enter to cancel: " confirm
  echo ""
  if [[ "$confirm" != "yes" ]]; then
    echo "   Cancelled."
    sleep 1; return
  fi

  echo -e "${BOLD}=== Deploying EventBridge Bus ===${RESET}"
  cd "$DEMO_DIR"
  npm install
  local bus_status
  bus_status=$(get_stack_status "$STACK_NAME")
  case "$bus_status" in
    CREATE_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
      echo -e "${GREEN}✓ Bus stack already deployed — skipping${RESET}" ;;
    *IN_PROGRESS)
      echo -e "${YELLOW}⚠ Bus stack deployment in progress — skipping${RESET}" ;;
    *)
      npx serverless deploy --stage "$STAGE" --region "$REGION" "${SLS_PROFILE_ARGS[@]}"
      local bus_rc=$?
      if [[ $bus_rc -ne 0 ]]; then
        echo -e "\n${RED}✗ EventBridge Bus deployment failed.${RESET}"
        pause; return
      fi ;;
  esac

  echo -e "\n${GREEN}✓ EventBridge Bus deployed: ${BUS_NAME}${RESET}"
  echo ""
  echo -e "${BOLD}=== Deploying WebSocket Service ===${RESET}"
  cd "$SERVICE_DIR"
  npm install

  local svc_status
  svc_status=$(get_stack_status "template-websocket-service-${STAGE}")
  case "$svc_status" in
    CREATE_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
      echo -e "${GREEN}✓ WebSocket Service stack already deployed — skipping${RESET}" ;;
    *IN_PROGRESS)
      echo -e "${YELLOW}⚠ WebSocket Service stack deployment in progress — skipping${RESET}" ;;
    *)
      npx serverless deploy --stage "$STAGE" --region "$REGION" "${SLS_PROFILE_ARGS[@]}"
      local svc_rc=$?
      if [[ $svc_rc -ne 0 ]]; then
        echo -e "\n${RED}✗ WebSocket Service deployment failed.${RESET}"
        pause; return
      fi ;;
  esac

  local extracted=""
  extracted=$(npx serverless info --stage "$STAGE" --region "$REGION" "${SLS_PROFILE_ARGS[@]}" 2>/dev/null \
    | grep -oE 'wss://[^[:space:]]+' | head -1) || true

  if [[ -z "$extracted" ]]; then
    local api_endpoint
    api_endpoint=$(aws apigatewayv2 get-apis \
      --region "$REGION" \
      --output text \
      --query "Items[?Name=='${WS_API_NAME}'].ApiEndpoint" 2>/dev/null | head -1) || true
    [[ -n "$api_endpoint" ]] && extracted="${api_endpoint}/${STAGE}"
  fi

  [[ -n "$extracted" ]] && WS_URL="$extracted"

  echo ""
  echo -e "${BOLD}=== Building and Deploying MFE ===${RESET}"

  local mfe_bucket cf_dist_id cf_url
  mfe_bucket=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='mfeBucketName'].OutputValue" \
    --output text 2>/dev/null) || true
  cf_dist_id=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='mfeDistributionId'].OutputValue" \
    --output text 2>/dev/null) || true
  cf_url=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='mfeUrl'].OutputValue" \
    --output text 2>/dev/null) || true

  if [[ -z "$mfe_bucket" || "$mfe_bucket" == "None" ]]; then
    echo -e "${YELLOW}⚠ Could not read stack outputs — skipping MFE deploy${RESET}"
  else
    cd "$MFE_DIR"
    npm install
    WS_URL="$WS_URL" npm run build:standalone

    if ! aws s3 sync dist/standalone "s3://${mfe_bucket}" --delete --region "$REGION"; then
      echo -e "${RED}✗ Failed to upload MFE to S3 — aborting${RESET}"
      pause; return
    fi

    aws cloudfront create-invalidation \
      --distribution-id "$cf_dist_id" --paths "/*" --output text > /dev/null

    echo ""
    echo -e "${BOLD}Waiting for CloudFront distribution to be ready...${RESET}"
    echo -e "${DIM}   (First deploy typically takes 5–7 minutes)${RESET}"
    while true; do
      local cf_status
      cf_status=$(aws cloudfront get-distribution \
        --id "$cf_dist_id" \
        --query "Distribution.Status" --output text 2>/dev/null)
      [[ "$cf_status" == "Deployed" ]] && break
      printf "  Status: %-12s  (checking again in 15s)\r" "$cf_status"
      sleep 15
    done
    echo ""
    echo -e "${GREEN}✓ CloudFront distribution is live${RESET}"

    [[ -n "$cf_url" && "$cf_url" != "None" ]] && MFE_URL="$cf_url"
  fi

  echo ""
  echo -e "${GREEN}✓ Infrastructure ready!${RESET}"
  echo -e "   WS URL:  ${CYAN}${WS_URL}${RESET}"
  echo -e "   MFE URL: ${CYAN}${MFE_URL}${RESET}"
  pause
}

action_emit_single() {
  require_deployed || return
  print_header
  echo -e "${BOLD}=== Emitting Single Event ===${RESET}"
  echo ""
  echo -e "   Before emitting, open the MFE in your browser:"
  echo -e "   ${CYAN}${MFE_URL}${RESET}"
  echo ""
  echo -e "   Press Enter once the page is open and you have clicked 'Connected'"
  read -r
  emit_event "thing-updated" '{"id":"demo-1","name":"Hello from the demo","status":"completed"}' \
    && echo -e "\n${GREEN}✓ Event emitted${RESET}" \
    || echo -e "\n${RED}✗ Failed to emit event${RESET}"
  echo ""
  echo "   → The event should appear in the browser instantly"
  pause
}

action_emit_burst() {
  require_deployed || return
  print_header
  echo -e "${BOLD}=== Emitting Burst (5 Events) ===${RESET}"
  echo ""
  local failed=0
  for i in 1 2 3 4 5; do
    emit_event "thing-updated" "{\"id\":\"burst-${i}\",\"name\":\"Event ${i} of 5\",\"sequence\":${i}}" \
      && echo -e "   ${GREEN}✓${RESET} Emitted event ${i} of 5" \
      || { echo -e "   ${RED}✗${RESET} Failed on event ${i}"; failed=1; }
    sleep 0.3
  done
  echo ""
  if [[ $failed -eq 0 ]]; then
    echo "   → All 5 events should appear in the browser in order"
  else
    echo -e "${YELLOW}   → Some events failed — check the output above${RESET}"
  fi
  pause
}

action_filtering() {
  require_deployed || return
  print_header
  echo -e "${BOLD}=== Per-Client Filtering Demo ===${RESET}"
  echo ""
  echo -e "   Open two browser tabs pointing to the MFE:"
  echo -e "   ${CYAN}${MFE_URL}${RESET}"
  echo ""
  echo "   In each tab use the Event Types input to set a different subscription:"
  echo -e "   ${BOLD}Tab 1:${RESET} add tag 'thing-updated'"
  echo -e "   ${BOLD}Tab 2:${RESET} add tag 'job-completed'"
  echo ""
  read -rp "   Press Enter when both tabs are connected and ready..."
  echo ""

  echo -e "   ${BOLD}Step 1:${RESET} Emitting 'thing-updated' → Tab 1 only"
  emit_event "thing-updated" '{"id":"filter-1","name":"This goes to Tab 1 only"}' \
    && echo -e "            ${GREEN}✓ Emitted${RESET}" \
    || echo -e "            ${RED}✗ Failed${RESET}"

  sleep 1
  echo ""

  echo -e "   ${BOLD}Step 2:${RESET} Emitting 'job-completed' → Tab 2 only"
  emit_event "job-completed" '{"id":"filter-2","name":"This goes to Tab 2 only"}' \
    && echo -e "            ${GREEN}✓ Emitted${RESET}" \
    || echo -e "            ${RED}✗ Failed${RESET}"

  echo ""
  echo "   → Tab 1 should show only 'thing-updated'"
  echo "   → Tab 2 should show only 'job-completed'"
  pause
}

action_replay() {
  require_deployed || return
  print_header
  echo -e "${BOLD}=== Missed Event Replay Demo ===${RESET}"
  echo ""
  echo -e "   ${BOLD}Step 1:${RESET} Click 'Disconnect' in the MFE"
  echo ""
  read -rp "   Press Enter when disconnected..."
  echo ""

  echo -e "   ${BOLD}Step 2:${RESET} Emitting events while disconnected"
  emit_event "thing-updated" '{"id":"missed-1","name":"You missed this one"}' \
    && echo -e "            ${GREEN}✓${RESET} Emitted: missed-1" \
    || echo -e "            ${RED}✗${RESET} Failed: missed-1"
  sleep 0.5
  emit_event "thing-updated" '{"id":"missed-2","name":"And this one too"}' \
    && echo -e "            ${GREEN}✓${RESET} Emitted: missed-2" \
    || echo -e "            ${RED}✗${RESET} Failed: missed-2"

  echo ""
  echo -e "   ${BOLD}Step 3:${RESET} Click 'Connect' in the MFE"
  echo "   → Both missed events should replay immediately on reconnect"
  pause
}

action_cleanup() {
  print_header
  echo -e "${BOLD}=== Remove All Deployed Resources ===${RESET}"
  echo ""
  echo -e "   ${RED}⚠  This will permanently delete:${RESET}"
  echo "      - template-websocket-service     (Stage: ${STAGE}, Region: ${REGION})"
  echo "      - template-websocket-demo-bus    (Stage: ${STAGE}, Region: ${REGION})"
  echo "      - MFE S3 bucket + CloudFront distribution"
  echo ""
  read -rp '   Type "yes" to confirm, or press Enter to cancel: ' confirm

  if [[ "$confirm" != "yes" ]]; then
    echo "   Cancelled."
    sleep 1; return
  fi

  echo ""
  echo -e "${BOLD}=== Removing WebSocket Service ===${RESET}"
  cd "$SERVICE_DIR"
  npx serverless remove --stage "$STAGE" --region "$REGION" "${SLS_PROFILE_ARGS[@]}" \
    && echo -e "\n${GREEN}✓ WebSocket Service removed${RESET}" \
    || echo -e "\n${RED}✗ Failed to remove WebSocket Service — check the output above${RESET}"

  echo ""
  echo -e "${BOLD}=== Emptying MFE S3 Bucket ===${RESET}"
  local bucket
  bucket=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='mfeBucketName'].OutputValue" \
    --output text 2>/dev/null) || true
  if [[ -n "$bucket" && "$bucket" != "None" ]]; then
    aws s3 rm "s3://${bucket}" --recursive --region "$REGION" \
      && echo -e "${GREEN}✓ MFE bucket emptied${RESET}" \
      || echo -e "${YELLOW}⚠ Could not empty bucket — stack removal may fail${RESET}"
  fi

  echo ""
  echo -e "${BOLD}=== Purging EventBridge Rules ===${RESET}"
  local eb_bus_name="template-websocket-demo-bus-${STAGE}"
  local eb_rules
  eb_rules=$(aws events list-rules --event-bus-name "$eb_bus_name" --region "$REGION" \
    --query "Rules[].Name" --output text 2>/dev/null) || true
  if [[ -n "$eb_rules" && "$eb_rules" != "None" ]]; then
    for rule in $eb_rules; do
      local targets
      targets=$(aws events list-targets-by-rule --rule "$rule" --event-bus-name "$eb_bus_name" \
        --region "$REGION" --query "Targets[].Id" --output text 2>/dev/null) || true
      if [[ -n "$targets" && "$targets" != "None" ]]; then
        # shellcheck disable=SC2086
        aws events remove-targets --rule "$rule" --event-bus-name "$eb_bus_name" \
          --region "$REGION" --ids $targets > /dev/null
      fi
      aws events delete-rule --name "$rule" --event-bus-name "$eb_bus_name" \
        --region "$REGION" && echo -e "   ${GREEN}✓${RESET} Deleted rule: $rule" || true
    done
  else
    echo "   (no rules found)"
  fi

  echo ""
  echo -e "${BOLD}=== Removing EventBridge Bus ===${RESET}"
  cd "$DEMO_DIR"
  "$DEMO_DIR/node_modules/.bin/serverless" remove --stage "$STAGE" --region "$REGION" "${SLS_PROFILE_ARGS[@]}" \
    && echo -e "\n${GREEN}✓ EventBridge Bus removed${RESET}" \
    || echo -e "\n${RED}✗ Failed to remove EventBridge Bus — check the output above${RESET}"

  WS_URL="(not deployed yet)"
  MFE_URL="(not deployed yet)"

  # ─── Verification ───────────────────────────────────────────────────────────

  echo ""
  echo -e "${BOLD}=== Verifying cleanup ===${RESET}"
  local cleanup_failed=0

  _resource_check() {
    local label="$1" gone="$2"
    if [[ "$gone" == "true" ]]; then
      echo -e "  ${GREEN}✓${RESET} $label"
    else
      echo -e "  ${RED}✗${RESET} $label  ${YELLOW}← still exists${RESET}"
      cleanup_failed=1
    fi
  }

  _stack_exists() {
    aws cloudformation describe-stacks --stack-name "$1" --region "$REGION" \
      --query "Stacks[0].StackStatus" --output text 2>/dev/null | grep -qvE '^$|DELETE_COMPLETE'
  }

  local svc_stack="template-websocket-service-${STAGE}"
  local bus_stack="$STACK_NAME"

  if _stack_exists "$svc_stack"; then svc_gone="false"; else svc_gone="true"; fi
  if _stack_exists "$bus_stack"; then bus_gone="false"; else bus_gone="true"; fi
  _resource_check "CloudFormation stack: $svc_stack" "$svc_gone"
  _resource_check "CloudFormation stack: $bus_stack" "$bus_gone"

  for table in connections subscriptions events; do
    local tbl_name="template-websocket-service-${STAGE}-${table}"
    local tbl_exists
    tbl_exists=$(aws dynamodb describe-table --table-name "$tbl_name" --region "$REGION" \
      --query "Table.TableName" --output text 2>/dev/null) || true
    [[ -z "$tbl_exists" || "$tbl_exists" == "None" ]] && local tbl_gone="true" || local tbl_gone="false"
    _resource_check "DynamoDB table:         $tbl_name" "$tbl_gone"
  done

  local bus_name="template-websocket-demo-bus-${STAGE}"
  local eb_exists
  eb_exists=$(aws events describe-event-bus --name "$bus_name" --region "$REGION" \
    --query "Name" --output text 2>/dev/null) || true
  [[ -z "$eb_exists" || "$eb_exists" == "None" ]] && local eb_gone="true" || local eb_gone="false"
  _resource_check "EventBridge bus:        $bus_name" "$eb_gone"

  local api_exists
  api_exists=$(aws apigatewayv2 get-apis --region "$REGION" \
    --query "Items[?Name=='template-websocket-service-${STAGE}'].ApiId" \
    --output text 2>/dev/null) || true
  [[ -z "$api_exists" || "$api_exists" == "None" ]] && local api_gone="true" || local api_gone="false"
  _resource_check "API Gateway (WebSocket): template-websocket-service-${STAGE}" "$api_gone"

  if [[ -n "$bucket" && "$bucket" != "None" ]]; then
    local bkt_exists
    bkt_exists=$(aws s3api head-bucket --bucket "$bucket" --region "$REGION" 2>/dev/null && echo yes || echo no)
    [[ "$bkt_exists" == "no" ]] && local bkt_gone="true" || local bkt_gone="false"
    _resource_check "S3 bucket:              $bucket" "$bkt_gone"
  fi

  echo ""
  if [[ $cleanup_failed -eq 0 ]]; then
    echo -e "${GREEN}✓ All resources confirmed removed.${RESET}"
  else
    echo -e "${RED}✗ Some resources were not removed — see above.${RESET}"
    echo -e "${YELLOW}  You may need to delete them manually in the AWS Console.${RESET}"
  fi
  pause
}

# ─── Main loop ────────────────────────────────────────────────────────────────

preflight

while true; do
  print_header
  print_menu
  read -rp "   Select an option: " choice
  echo ""

  case "$choice" in
    0) action_deploy ;;
    1) action_emit_single ;;
    2) action_emit_burst ;;
    3) action_filtering ;;
    4) action_replay ;;
    9) action_cleanup ;;
    q|Q) echo "Goodbye!"; exit 0 ;;
    *) echo -e "   ${YELLOW}Invalid option: ${choice}${RESET}"; sleep 1 ;;
  esac
done
