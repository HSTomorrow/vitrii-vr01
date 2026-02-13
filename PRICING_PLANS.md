# Vitrii - Pricing Plans Strategy

## Current Status (Updated)
- **Individual/Professional Plan**: R$ 19,90 para 3 meses por anúncio
- **Payment Model**: One-time payment per ad listing period
- **Target**: Small sellers and individual advertisers

---

## Recommended Business Plans

Based on SaaS B2B industry standards and marketplace dynamics, we recommend implementing a tiered pricing strategy:

### **Plan 1: Básico (Free/Entry)**
**Target**: First-time sellers, testers
- **Price**: Free or R$ 0,00
- **Features**:
  - 1 active ad at a time
  - Basic features (title, description, photos)
  - 30-day listing period
  - Basic analytics (views only)
  - Community support

**Why**: Lower barrier to entry, higher conversion to paid plans

---

### **Plan 2: Profissional (Current)**
**Target**: Active sellers, small shops
- **Price**: R$ 19,90 para 3 meses (per ad)
- **Features**:
  - Multiple active ads (up to 5)
  - All features included
  - 3-month listing period
  - Full analytics (views, engagement, contacts)
  - Email support
  - Featured placement option
  - QR Code and PIX payment integration

**Status**: ✅ **IMPLEMENTED**

---

### **Plan 3: Empresarial (Business/Team)**
**Target**: Small shops, local brands
- **Price**: R$ 79,90/month OR R$ 199,90/3 months
- **Billing**: Monthly or quarterly subscriptions (auto-renewing)
- **Features** (includes all Profissional features +):
  - Unlimited active ads
  - Team management (up to 3 team members)
  - Advanced analytics & reports
  - Bulk upload (CSV/spreadsheet)
  - API access for integrations
  - Priority email support
  - Inventory management
  - Custom branding options
  - Ad scheduling/automation

**Rationale**: 
- Scales with business growth
- Recurring revenue model (healthier for SaaS)
- Team collaboration for small shops
- Estimated LTV: 3-6x higher than individual plans

---

### **Plan 4: Premium/Enterprise**
**Target**: Large retailers, franchises, distribution centers
- **Price**: Custom (R$ 299+/month or negotiated)
- **Billing**: Annual contracts with volume discounts
- **Features** (includes all Empresarial features +):
  - Unlimited everything
  - Dedicated account manager
  - Custom integrations (ERP, inventory systems)
  - White-label options
  - Advanced automation rules
  - 24/7 priority phone/chat support
  - Custom analytics & BI reports
  - Training & onboarding sessions
  - SLA guarantees

**Rationale**:
- High-touch, high-value accounts
- Dedicated support justifies premium pricing
- Negotiated deals per customer size/volume
- Potential for 12-month prepayments (better cash flow)

---

## Pricing Recommendations & Best Practices

### 1. **Value-Based Metrics** (Align pricing with customer value)
- Number of active listings
- Number of team members
- Monthly views/engagement volume
- API call volume
- Storage for photos/documents

### 2. **Implementation Strategy**
- **Phase 1** (Now): Keep individual R$ 19,90 model, add free tier
- **Phase 2** (Month 2-3): Launch Empresarial plan with monthly subscription
- **Phase 3** (Month 4+): Launch Enterprise tier with custom pricing
- **Phase 4**: Implement usage-based add-ons (featured placement, promoted ads, advanced analytics)

### 3. **Discount Strategies**
- **Annual commitment**: 20% discount on annual plans
- **Multi-ad packs**: Bundle 3+ ads at 15% discount
- **Early bird**: First 100 Enterprise customers get 30% off first year
- **Volume based**: Shops with 10+ listings get automatic discount

### 4. **Key Metrics to Monitor**
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate (monthly cancellations)
- Average Revenue Per User (ARPU)
- Conversion rate (Free → Paid)
- Net Revenue Retention (expansion revenue)

### 5. **Upsell & Cross-Sell Opportunities**
- Featured placement (boost visibility): R$ 9,90/month
- Promoted ads (paid advertising): R$ 49,90/month
- Advanced analytics addon: R$ 29,90/month
- Lead gen & CRM integration: Custom pricing

---

## Financial Impact Projection

### **Scenario: 100 Active Users**

| Plan | Count | Monthly Revenue | Annual |
|------|-------|-----------------|---------|
| Básico | 40 | R$ 0 | R$ 0 |
| Profissional | 40 | R$ 127* | R$ 1,524 |
| Empresarial | 15 | R$ 1,199 | R$ 14,388 |
| Enterprise | 5 | R$ 1,500+ | R$ 18,000+ |
| **TOTAL** | **100** | **~R$ 2,826** | **~R$ 33,912** |

*Profissional: (40 users × R$19.90 ÷ 3 months) = R$264/month average

### **Scenario: 500 Active Users (12 months projection)**

| Plan | Count | Monthly Revenue | Annual |
|------|-------|-----------------|---------|
| Básico | 150 | R$ 0 | R$ 0 |
| Profissional | 250 | R$ 1,659 | R$ 19,908 |
| Empresarial | 75 | R$ 5,993 | R$ 71,920 |
| Enterprise | 25 | R$ 7,500+ | R$ 90,000+ |
| **TOTAL** | **500** | **~R$ 15,152** | **~R$ 181,828** |

---

## Comparison with Market Standards

### **Brazilian Marketplace/SaaS Benchmarks:**
- OLX Premium: R$ 9,90/mês
- VivaReal Destaque: R$ 14,90/mês
- B2Brazil (B2B): R$ 99,90/mês
- Shopify Starter: R$ 39,90/mês

**Our positioning**: Mid-to-premium, value-focused for regional sellers

---

## Next Steps

1. **Immediate** (This week):
   - ✅ Fix PIX key copy functionality
   - ✅ Update to R$ 19,90 (3 months)
   - Implement Free/Básico plan in UI

2. **Short-term** (Next 2-4 weeks):
   - Design Empresarial plan landing page
   - Implement monthly/quarterly subscription logic
   - Create team management features
   - Set up recurring billing system

3. **Medium-term** (Month 2-3):
   - Launch Empresarial plan to selected customers
   - Gather feedback and iterate
   - Build usage analytics for upsell opportunities
   - Create admin dashboard for plan upgrades

4. **Long-term** (Quarter 2+):
   - Launch Enterprise tier
   - Implement usage-based pricing add-ons
   - Develop partnerships with logistics/retailers
   - Optimize LTV through retention campaigns

---

## Implementation Notes

- Use Supabase for storing user plans and subscription dates
- Implement webhook handlers for payment status updates
- Create admin interface for plan management and overrides
- Set up email notifications for plan expiration and renewals
- Monitor churn and engagement metrics by plan type

