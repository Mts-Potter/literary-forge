# Security Setup Guide
## Phase 1: Critical AWS Credential Rotation

**Status:** ⚠️ **IMMEDIATE ACTION REQUIRED**

### Current Situation
- ✅ Credentials were NEVER committed to git (verified)
- ✅ `.gitignore` properly configured
- ⚠️ Credentials still exist in `.env.local` (local risk)

### Action Required: Rotate AWS Credentials

#### Step 1: Create Least-Privilege IAM Policy

1. Log into [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to **Policies** → **Create Policy**
3. Use this JSON policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeOnly",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:foundation-model/us.anthropic.claude-3-5-haiku-*",
        "arn:aws:bedrock:*:*:foundation-model/anthropic.claude-*"
      ],
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

4. Name it: `LiteraryForge-Bedrock-InvokeOnly`
5. Save policy

#### Step 2: Create New IAM User (or Update Existing)

1. Navigate to **Users** → **Create User** (or select existing user)
2. **Attach Policy:** `LiteraryForge-Bedrock-InvokeOnly`
3. **Create Access Key:**
   - Use case: Application running on AWS compute service
   - Create key
   - **SAVE** Access Key ID and Secret Access Key

#### Step 3: Deactivate Old Credentials

1. Find user with current credentials
2. Security credentials → Access keys
3. Find key: `AKIASJIFO7CEOTQEU6RR`
4. Click **Actions** → **Deactivate** (DO NOT DELETE yet - keep as backup for 24 hours)

#### Step 4: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **literary-forge**
3. **Settings** → **Environment Variables**
4. Add/Update:
   ```
   AWS_ACCESS_KEY_ID=<new_key_from_step_2>
   AWS_SECRET_ACCESS_KEY=<new_secret_from_step_2>
   AWS_REGION=us-east-1
   BEDROCK_MODEL_ID=us.anthropic.claude-3-5-haiku-20241022-v1:0
   ```
5. Apply to: ☑ Production ☑ Preview ☑ Development
6. **Save**

#### Step 5: Update Local `.env.local`

Option A: Use placeholder (recommended):
```bash
# .env.local
AWS_ACCESS_KEY_ID="see_vercel_dashboard"
AWS_SECRET_ACCESS_KEY="see_vercel_dashboard"
AWS_REGION="us-east-1"
```

Option B: Use new credentials locally (less secure):
```bash
# .env.local
AWS_ACCESS_KEY_ID="<new_key>"
AWS_SECRET_ACCESS_KEY="<new_secret>"
AWS_REGION="us-east-1"
```

#### Step 6: Test Deployment

```bash
# Deploy to preview branch
git checkout -b test/new-aws-creds
git commit --allow-empty -m "test: verify new AWS credentials"
git push origin test/new-aws-creds

# Test API endpoints
curl -X POST https://your-preview.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"type":"destyle","text":"Test text"}'
```

#### Step 7: Delete Old Credentials (After 24 Hours)

1. Return to IAM Console
2. Security credentials → Access keys
3. Find key: `AKIASJIFO7CEOTQEU6RR`
4. Click **Actions** → **Delete**
5. Confirm deletion

---

## Phase 1.2: AWS Budget Alerts

### Create Budget Alerts

1. Go to [AWS Billing Console](https://console.aws.amazon.com/billing/)
2. **Budgets** → **Create Budget**
3. Budget type: **Cost budget**
4. Configure:
   - **Name:** Literary-Forge-Monthly-Limit
   - **Period:** Monthly
   - **Budget amount:** $100

5. **Set Alerts:**

   **Alert 1 - Warning:**
   - Threshold: $5 (5% of budget)
   - Email: your-email@example.com

   **Alert 2 - Critical:**
   - Threshold: $20 (20% of budget)
   - Email: your-email@example.com

   **Alert 3 - Emergency:**
   - Threshold: $50 (50% of budget)
   - Email: your-email@example.com
   - SNS Topic: Create new → `literary-forge-budget-alerts`

6. **Create Budget**

### Enable CloudWatch Monitoring

```bash
# Install AWS CLI if not already installed
brew install awscli  # macOS
# or: pip install awscli

# Configure
aws configure

# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name LiteraryForge \
  --dashboard-body file://docs/cloudwatch-dashboard.json
```

---

## Security Checklist

### Immediate (Day 1)
- [ ] Create least-privilege IAM policy
- [ ] Generate new AWS access keys
- [ ] Deactivate old credentials
- [ ] Update Vercel environment variables
- [ ] Test API endpoints with new credentials
- [ ] Update local `.env.local` to use placeholders

### Short-term (Days 2-3)
- [ ] Set up AWS Budget alerts ($5, $20, $50)
- [ ] Enable CloudWatch logging for Bedrock
- [ ] Delete old credentials (after 24hr verification)
- [ ] Install pre-commit hooks for secret detection

### Long-term (Week 2+)
- [ ] Implement kill switch Lambda (auto-detach policy at $50)
- [ ] Set up AWS CloudTrail for audit logs
- [ ] Review IAM policies quarterly
- [ ] Rotate credentials every 90 days

---

## Cost Monitoring Queries

### Check Current Bedrock Costs
```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://bedrock-cost-filter.json
```

### Bedrock Token Usage (CloudWatch)
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name InvocCount \
  --dimensions Name=ModelId,Value=us.anthropic.claude-3-5-haiku-20241022-v1:0 \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-31T23:59:59Z \
  --period 86400 \
  --statistics Sum
```

---

## Emergency Procedures

### If Budget Alert Triggered

1. **Immediate:** Check CloudWatch Logs
   ```bash
   aws logs tail /aws/lambda/your-function --follow
   ```

2. **Investigate:** Check Bedrock invocations
   ```bash
   aws cloudtrail lookup-events \
     --lookup-attributes AttributeKey=EventName,AttributeValue=InvokeModel \
     --max-results 50
   ```

3. **If Attack Detected:** Deactivate credentials
   ```bash
   aws iam update-access-key \
     --access-key-id AKIAXXXXXXXX \
     --status Inactive \
     --user-name literary-forge-bedrock
   ```

4. **Rotate:** Generate new credentials and update Vercel

---

## Questions?

If you encounter issues:
1. Check AWS CloudWatch Logs
2. Review Vercel deployment logs
3. Test API routes in preview environment first
4. Verify IAM policy syntax in [IAM Policy Simulator](https://policysim.aws.amazon.com/)

**Cost to implement this phase:** $0 (all AWS free tier)
**Time required:** 1-2 hours
**Priority:** CRITICAL - Do this BEFORE any other development work
