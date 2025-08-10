# Stripe Billing Setup Guide

## Overview
This guide will help you configure Stripe billing for the Screenshot API application with the pricing tiers:
- **Free**: 500 screenshots/month (no payment required)
- **Pro**: $29/month, 5,000 screenshots + $0.01/screenshot overage
- **Enterprise**: $99/month, 100,000 screenshots + $0.005/screenshot overage

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and create an account
2. Complete your business verification process
3. Navigate to the Dashboard

## Step 2: Get API Keys

1. In your Stripe Dashboard, go to **Developers** → **API Keys**
2. Copy your **Test** keys for development:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

## Step 3: Create Products and Prices

### Create Pro Plan ($29/month)
1. Go to **Products** in your Stripe Dashboard
2. Click **+ Add Product**
3. Fill in:
   - **Name**: Pro Plan
   - **Description**: 5,000 screenshots per month with overage billing
4. Under **Pricing**, click **Add Price**:
   - **Type**: Recurring
   - **Price**: $29.00 USD
   - **Billing period**: Monthly
5. Save and copy the **Price ID** (starts with `price_`)

### Create Enterprise Plan ($99/month)
1. Click **+ Add Product** again
2. Fill in:
   - **Name**: Enterprise Plan  
   - **Description**: 100,000 screenshots per month with overage billing
3. Under **Pricing**, click **Add Price**:
   - **Type**: Recurring
   - **Price**: $99.00 USD
   - **Billing period**: Monthly
4. Save and copy the **Price ID** (starts with `price_`)

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here

# Stripe Product/Price IDs
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id_here

# Webhook Secret (set up in Step 5)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-secure-jwt-secret-here
```

## Step 5: Configure Webhooks (For Production)

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Set **Endpoint URL** to: `https://yourdomain.com/api/billing/webhooks`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Save and copy the **Signing Secret** (starts with `whsec_`)

## Step 6: Test the Integration

1. Restart your Next.js development server
2. Navigate to `/pricing` in your application
3. Try selecting the **Pro Plan** - it should redirect to Stripe Checkout
4. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`

## Step 7: Billing Dashboard Features

Once configured, users can:
- View current subscription status
- Track monthly usage with visual meters
- See overage charges in real-time
- Access Stripe Customer Portal for:
  - Updating payment methods
  - Downloading invoices
  - Canceling subscriptions

## Step 8: Production Checklist

Before going live:

- [ ] Switch from test to live Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Set up proper SSL certificates
- [ ] Configure proper JWT secrets
- [ ] Test the complete billing flow
- [ ] Set up monitoring for failed payments

## Troubleshooting

### Common Issues:

1. **"Stripe is not configured" error**
   - Check that `STRIPE_SECRET_KEY` is set correctly
   - Verify the key starts with `sk_test_` or `sk_live_`

2. **Checkout not working**
   - Verify `STRIPE_PRO_PRICE_ID` and `STRIPE_ENTERPRISE_PRICE_ID` are correct
   - Ensure prices are set to "recurring" in Stripe Dashboard

3. **Webhooks failing**
   - Check webhook endpoint is accessible
   - Verify webhook secret matches the one in Stripe Dashboard

4. **Usage tracking not working**
   - Database migrations should run automatically
   - Check server logs for any migration errors

## Support

For questions about this integration:
1. Check the application logs for specific error messages
2. Verify all environment variables are set correctly  
3. Test with Stripe's test mode first before going live