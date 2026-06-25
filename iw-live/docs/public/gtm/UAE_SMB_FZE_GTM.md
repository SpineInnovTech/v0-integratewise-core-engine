# UAE SMB & FZE — GTM Strategy

> Higher ARPU than India. English-speaking. Tech-savvy. Regulatory complexity = more tools = more pain.

---

## WHY UAE

1. **200,000+ FZEs** (Free Zone Establishments) — each one is a small business juggling 8-12 tools
2. **Higher ARPU** — $49-199/mo vs ₹999/mo. 5-10x India pricing.
3. **English-first** — no localization needed for v1
4. **Regulatory complexity** — VAT, corporate tax (new), visa sponsorship, trade licenses = more data silos
5. **WhatsApp-dominant** — business runs on WhatsApp just like India
6. **Expat founder density** — Indian, Pakistani, Filipino founders who understand the pain
7. **Dubai = word of mouth** — tight business communities, one founder tells 20 others

## THE UAE SMB PAIN

```
A typical Dubai FZE founder's morning:
1. Check WhatsApp for client messages and supplier quotes
2. Open Zoho Books / QuickBooks for invoicing
3. Check bank app (Emirates NBD / ADCB / Mashreq) for payments
4. Open Google Sheets for project tracking / client pipeline
5. Check Dubizzle / Property Finder for leads (if real estate)
6. Open Trello / Notion for team tasks
7. Check visa status on GDRFA / ICA portal
8. Reply to emails on Gmail / Outlook
9. Update CRM (Zoho / HubSpot / spreadsheet)
10. Check Stripe / PayTabs / Network International for card payments

Time wasted: 3-4 hours/day
Pain: No single view of clients, payments, projects, and compliance
```

---

## UAE CONNECTOR STACK

### Already Built (from existing 70+)

| Connector         | UAE relevance                       |
| ----------------- | ----------------------------------- |
| WhatsApp Business | Primary business communication      |
| Google Sheets     | Everyone's CRM/tracker              |
| Google Drive      | Document storage                    |
| Google Calendar   | Meetings, deadlines                 |
| Gmail / Outlook   | Email communication                 |
| Slack             | Team communication                  |
| Stripe            | International payments              |
| HubSpot           | CRM for growing companies           |
| Zoho CRM          | Popular in UAE SMBs                 |
| QuickBooks        | Accounting (US/UK companies in UAE) |
| Shopify           | E-commerce                          |
| Notion            | Project management                  |
| Jira / Linear     | Tech companies                      |

### Need to Build (UAE-specific)

| #   | Connector                        | What it does                                                           | Priority | Effort |
| --- | -------------------------------- | ---------------------------------------------------------------------- | -------- | ------ |
| 1   | Zoho Books                       | #1 accounting in UAE SMBs. Invoices, VAT, expenses.                    | HIGH     | 2 days |
| 2   | PayTabs                          | UAE/GCC payment gateway. Card + Apple Pay.                             | HIGH     | 2 days |
| 3   | Network International (N-Genius) | POS + online payments. Dominant in UAE retail.                         | HIGH     | 2 days |
| 4   | Xero                             | Popular with UK-origin FZEs. Already built but verify UAE VAT support. | MEDIUM   | 1 day  |
| 5   | Tabby / Tamara                   | Buy-now-pay-later. Huge in UAE e-commerce.                             | MEDIUM   | 2 days |
| 6   | Noon Seller                      | UAE e-commerce marketplace (like Amazon for GCC).                      | MEDIUM   | 2 days |
| 7   | Deliveroo / Talabat              | Restaurant/food business orders.                                       | MEDIUM   | 2 days |
| 8   | Fetchr / Aramex                  | Shipping/logistics in GCC.                                             | MEDIUM   | 2 days |
| 9   | Dubizzle / Property Finder       | Real estate leads.                                                     | LOW      | 2 days |
| 10  | Bayzat                           | HR/payroll for UAE companies. Visa, insurance, payroll.                | LOW      | 3 days |

---

## UAE BUSINESS TYPES

### FZE / Freelancer (largest segment)

```
Entity types: client, project, invoice, payment, expense, document, task
Priority fields:
  client: name, company, trade_license, vat_number, email, whatsapp, outstanding_balance
  project: name, client_id, status, value, start_date, deadline, deliverables
  invoice: number, client_id, amount, vat_amount, status, due_date, currency (AED/USD)
  payment: amount, method (bank_transfer/card/cash), reference, client_id, date
  expense: category, amount, vat_reclaimable, receipt_url, vendor
  document: type (trade_license/visa/contract/proposal), expiry_date, status
```

### Trading Company

```
Entity types: supplier, customer, purchase_order, sales_order, shipment, payment, inventory
Priority fields:
  supplier: name, country, trade_license, payment_terms, outstanding
  customer: name, country, credit_limit, outstanding, last_order
  purchase_order: supplier_id, items, total, currency, status, eta
  sales_order: customer_id, items, total, margin, status, delivery_date
  shipment: tracking, carrier (Aramex/DHL/Fetchr), status, customs_clearance
  inventory: product, warehouse, quantity, reorder_level, landed_cost
```

### Restaurant / F&B

```
Entity types: order, customer, menu_item, supplier, payment, review, delivery
Priority fields:
  order: channel (dine-in/talabat/deliveroo/noon/whatsapp), items, total, status
  customer: name, phone, order_count, total_spent, last_order, preferences
  supplier: name, category (produce/meat/dairy), payment_terms, last_delivery
  delivery: platform, order_id, status, driver, estimated_time
```

### Real Estate / Property

```
Entity types: listing, lead, client, viewing, transaction, document, commission
Priority fields:
  listing: property_type, location, price, status (available/reserved/sold), owner
  lead: name, phone, source (dubizzle/property_finder/whatsapp/referral), budget, preference
  client: name, nationality, visa_status, budget, properties_viewed
  viewing: listing_id, client_id, date, feedback, agent
  transaction: type (sale/rent), amount, commission, status, closing_date
```

### E-commerce (Noon/Shopify)

```
Entity types: order, product, customer, shipment, return, review, payment
Priority fields:
  order: channel (noon/shopify/instagram/whatsapp), items, total, status
  product: name, sku, stock, price, cost, margin, platform_listing_status
  shipment: carrier (Aramex/Fetchr/Noon Express), tracking, status
  return: reason, status, refund_amount, restocking
```

### Professional Services (Consultancy, Legal, Accounting)

```
Entity types: client, engagement, invoice, timesheet, document, task
Priority fields:
  client: company, contact, trade_license, engagement_type, retainer_amount
  engagement: client_id, type (advisory/audit/legal), status, value, team
  invoice: engagement_id, hours, rate, amount, vat, status
  timesheet: consultant, client_id, hours, date, description
```

---

## UAE ONBOARDING

```
Step 1: "What's your business?"

├── 🏢 "FZE / Freelancer" (consulting, design, marketing, tech)
├── 📦 "Trading / Import-Export"
├── 🍽️ "Restaurant / F&B"
├── 🏠 "Real Estate / Property"
├── 🛒 "E-commerce / Retail"
├── 💼 "Professional Services" (legal, accounting, HR)
├── 🏗️ "Construction / Contracting"
├── 💻 "Tech Company" (→ enterprise path)
├── 👤 "Personal use"

Step 2: "Connect your tools" (filtered by business type)

FZE sees: WhatsApp, Zoho Books, Stripe, Google Sheets, Gmail, Calendar
Trading sees: WhatsApp, Zoho Books, Google Sheets, Aramex, bank app
Restaurant sees: WhatsApp, Talabat, Deliveroo, POS, Zoho Books
Real Estate sees: WhatsApp, Dubizzle, Property Finder, Google Sheets, Calendar
E-commerce sees: Shopify/Noon, PayTabs, Aramex, WhatsApp, Google Sheets
```

---

## UAE PRICING

| Plan       | Price             | For whom                                                       |
| ---------- | ----------------- | -------------------------------------------------------------- |
| Free       | $0                | Try it — 10 entities, 1 connector                              |
| Starter    | $49/mo (AED 179)  | Solo FZE, freelancer — 100 entities, 3 connectors              |
| Growth     | $99/mo (AED 365)  | Growing SMB — 500 entities, 5 connectors, Twin triggers        |
| Business   | $199/mo (AED 729) | Multi-person team — 2000 entities, 10 connectors, all features |
| Enterprise | Custom            | Large company — unlimited, SSO, dedicated support              |

**Comparison:**

- Zoho One: $45/user/mo (but per-user pricing kills teams)
- Monday.com: $36/user/mo (project management only, no accounting/payments)
- IntegrateWise: $49-199/mo flat (connects everything, not per-user)

---

## UAE DISTRIBUTION

| Channel                  | How                                                 | Why                                      |
| ------------------------ | --------------------------------------------------- | ---------------------------------------- |
| Dubai Startup Hub / in5  | Partner program, demo days                          | Access to 500+ startups                  |
| DMCC / JAFZA / DAFZA     | Free zone business communities                      | Direct access to FZEs                    |
| LinkedIn (Dubai)         | Founder content, case studies                       | High engagement in UAE business LinkedIn |
| WhatsApp business groups | Dubai entrepreneurs, Indian business owners in UAE  | Free, high conversion                    |
| CA / PRO networks        | Company formation agents recommend to new FZEs      | Every new FZE needs tools                |
| Coworking spaces         | A4 Space, Nasab, WeWork Dubai                       | Demo stations, partnerships              |
| Google Ads (UAE)         | "business management UAE", "FZE tools", "Dubai CRM" | High intent, $2-5 CPC                    |
| Instagram / TikTok       | "How I run my Dubai business from one app"          | Visual, shareable                        |

---

## UAE TWIN TRIGGERS

| Trigger             | UAE SMB context                                                   |
| ------------------- | ----------------------------------------------------------------- |
| health_drop         | Client engagement dropped — no orders in 30 days                  |
| renewal_approaching | Trade license expiry in 60 days / Visa renewal due                |
| engagement_drop     | Client stopped responding on WhatsApp                             |
| arr_change          | Monthly revenue dropped 20%                                       |
| support_escalation  | 3+ complaints from same client                                    |
| stale_data          | Zoho Books not synced in 3 days                                   |
| context_gap         | Big client, no WhatsApp history linked                            |
| signal_cluster      | Payment failed + order cancelled + complaint                      |
| goal_at_risk        | Quarterly revenue target behind by 30%                            |
| memory_conflict     | AI says client prefers email but WhatsApp history shows otherwise |

---

## UAE COMPLIANCE SIGNALS (unique to UAE)

Twin triggers specific to UAE regulatory:

| Signal               | What it detects                           | Action                                                      |
| -------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| VAT filing due       | Quarterly VAT return deadline approaching | "VAT return due in 15 days. ₹X in reclaimable VAT pending." |
| Trade license expiry | License renewal within 90/60/30 days      | "Trade license expires in 45 days. Renewal cost: AED X."    |
| Visa expiry          | Employee/sponsor visa approaching expiry  | "3 employee visas expire in next 60 days."                  |
| Corporate tax        | New UAE corporate tax filing (2024+)      | "Corporate tax filing due. Estimated liability: AED X."     |
| Audit requirement    | Revenue threshold crossed requiring audit | "Revenue crossed AED 50M. Statutory audit required."        |

---

## DUAL MARKET STRATEGY

```
INDIA SMB                          UAE SMB
₹999/mo                           $49/mo (AED 179)
WhatsApp + Tally + Razorpay        WhatsApp + Zoho Books + Stripe
Hindi content                      English content
CA network distribution            PRO/formation agent distribution
JustDial + IndiaMART leads         LinkedIn + coworking leads
Volume play (1000s of users)       ARPU play (100s of users, 5x price)

BOTH USE:
Same Spine
Same Entity 360
Same Twin Triggers
Same Approval-Based Personal Memory
Same Pipeline
Same Architecture

Revenue target:
India: ₹2L/mo by week 16 (200 users × ₹999)
UAE: $10K/mo by week 16 (100 users × $99 avg)
Combined: ~$3,500/mo + $10,000/mo = $13,500/mo MRR
```

---

## BUILD ORDER (combined)

| Week | India                                 | UAE                           | Connectors total         |
| ---- | ------------------------------------- | ----------------------------- | ------------------------ |
| 1-2  | Google Sheets + Razorpay wrapper      | Same connectors work for both | 5 (existing) + 2 new = 7 |
| 3-4  | Tally + PhonePe                       | Zoho Books + PayTabs          | 11                       |
| 5-6  | Telegram + Khatabook                  | Network International         | 14                       |
| 7-8  | IndiaMART + JustDial                  | Noon Seller + Aramex          | 18                       |
| 9-12 | Amazon Seller + Flipkart + Shiprocket | Tabby + Deliveroo + Bayzat    | 24                       |

Google Sheets connector serves BOTH markets. Build it first.
