# India SMB — GTM Strategy & Connector Roadmap

> Hit this market first. Daily revenue while enterprise builds.
> Same Spine. Same Entity 360. Different connectors. Different onboarding.

---

## WHY INDIA SMB FIRST

1. **Daily money** — ₹999/mo × 1000 users = ₹10L/mo recurring. No 6-month sales cycle.
2. **Massive TAM** — 63M+ MSMEs in India. Every one of them juggles 5-6 apps.
3. **Word of mouth** — One business owner tells 10 others. CA tells 50 clients.
4. **Self-serve** — No demo needed. Connect WhatsApp + Tally, see value in 5 minutes.
5. **Enterprise starts here** — CTO tries Personal workspace → rolls out to team → enterprise deal.

## THE PAIN (every Indian business owner)

```
Morning routine:
1. Check WhatsApp for orders (50+ messages)
2. Open Tally to check yesterday's sales
3. Open PhonePe/GPay to verify payments
4. Open Google Sheets to update credit ledger
5. Call logistics partner to confirm route
6. Check Amazon Seller Central for online orders
7. Reply to JustDial leads

Time wasted: 2-3 hours/day
Money lost: missed orders, forgotten credits, late deliveries
```

## THE SOLUTION

```
IntegrateWise connects WhatsApp + Tally + Payments + Sheets into one screen.

One view shows:
- Today's orders (from WhatsApp + Amazon + website)
- Payments received (from Razorpay + PhonePe + UPI)
- Credit outstanding (from Tally + Khatabook)
- Delivery status (from logistics partner)
- Customer history (Entity 360 — every interaction across every tool)
```

---

## CONNECTOR PRIORITY (Build order)

### Wave 1 — Launch (Week 1-2) — Use what exists + 3 new

| #   | Connector         | Status              | Effort        | Why first             |
| --- | ----------------- | ------------------- | ------------- | --------------------- |
| 1   | WhatsApp Business | ✅ EXISTS           | —             | Everyone uses it      |
| 2   | Google Sheets     | 🔨 BUILD            | 2 days        | Everyone's CRM/ledger |
| 3   | Razorpay          | ✅ EXISTS (tenancy) | 1 day wrapper | #1 payment gateway    |
| 4   | Google Calendar   | ✅ EXISTS           | —             | Appointments          |
| 5   | Google Drive      | ✅ EXISTS           | —             | Documents             |

**Launch with 5 connectors. That's enough for first 100 users.**

### Wave 2 — Growth (Week 3-4) — India payments + accounting

| #   | Connector          | Effort | Why                                   |
| --- | ------------------ | ------ | ------------------------------------- |
| 6   | Tally Prime API    | 3 days | #1 accounting in India, 7M+ users     |
| 7   | Telegram Bot API   | 1 day  | Business groups, channels             |
| 8   | Google My Business | 2 days | Reviews, messages, local SEO          |
| 9   | PhonePe Business   | 2 days | UPI payment data                      |
| 10  | Vyapar / Khatabook | 2 days | Credit tracking for retail businesses |

### Wave 3 — Scale (Month 2) — E-commerce + leads

| #   | Connector              | Effort | Why                                |
| --- | ---------------------- | ------ | ---------------------------------- |
| 11  | Amazon Seller Central  | 3 days | Online sellers                     |
| 12  | Flipkart Seller Hub    | 2 days | India e-commerce                   |
| 13  | IndiaMART              | 2 days | B2B leads (manufacturing, trading) |
| 14  | JustDial Leads         | 2 days | Local business leads               |
| 15  | Shiprocket / Delhivery | 2 days | Shipping tracking                  |
| 16  | Instagram Business     | 2 days | DM orders, engagement              |

### Wave 4 — Industry (Month 3) — Vertical-specific

| #   | Connector             | For whom            |
| --- | --------------------- | ------------------- |
| 17  | Practo                | Doctors, clinics    |
| 18  | ClassPlus / Teachmint | Coaching institutes |
| 19  | NoBroker              | Property managers   |
| 20  | DealerSocket / DMS    | Auto dealerships    |

---

## ONBOARDING (India SMB version)

```
Step 1: "What do you do?"

├── 🛒 "I run a retail / trading business"
├── 📦 "I sell online"
├── ✂️ "I run a service business" (salon, repair, clinic, CA)
├── 🚚 "I'm a distributor / wholesaler"
├── 💼 "I'm a professional" (CA, lawyer, consultant)
├── 🏗️ "I'm in manufacturing / trading"
├── 🎓 "I'm in education" (school, coaching, tutor)
├── 🏠 "I manage properties"
├── 💻 "I work in tech" (→ enterprise path)
├── 👤 "Personal use"

Step 2: "Connect your tools" (shows relevant connectors only)

Retail business sees: WhatsApp, Tally, Razorpay, Google Sheets, PhonePe
Online seller sees: Shopify/Amazon, Razorpay, Shiprocket, WhatsApp
Service business sees: WhatsApp, Calendar, Razorpay, Google My Business
Professional sees: WhatsApp, Tally, Google Drive, Calendar, Razorpay

Step 3: "Setting up..." (priority fetch — 5 records in 15 seconds)

Step 4: Dashboard with real data
```

---

## SCHEMA PER BUSINESS TYPE

### Retail / Trading Business

```
Entity types: customer, order, payment, product, credit_entry, supplier
Priority fields:
  customer: name, phone, whatsapp_id, credit_balance, last_order
  order: items, total, payment_status, delivery_status, channel (whatsapp/walk-in/online)
  payment: amount, method (UPI/cash/card), reference, customer_id
  credit_entry: customer_id, amount, due_date, status (pending/paid)
```

### Online Seller

```
Entity types: order, product, shipment, return, review, payment
Priority fields:
  order: order_id, channel (amazon/flipkart/shopify), items, total, status
  shipment: tracking_id, carrier, status, estimated_delivery
  return: reason, status, refund_amount
```

### Service Business

```
Entity types: customer, appointment, payment, review, service_record
Priority fields:
  customer: name, phone, last_visit, total_spent, rating
  appointment: date, time, service_type, status, customer_id
  service_record: service_type, amount, notes, customer_id
```

### Distributor / Wholesaler

```
Entity types: customer, order, route, credit_entry, inventory, supplier
Priority fields:
  customer: name, area, credit_limit, outstanding, last_delivery
  route: date, stops, total_delivery, total_collection
  inventory: product, stock, reorder_level, last_updated
```

### Professional (CA, Lawyer)

```
Entity types: client, invoice, document, appointment, task
Priority fields:
  client: name, company, gst_number, pending_invoices, last_meeting
  invoice: amount, status, due_date, client_id
  document: type (ITR/GST/agreement), status, client_id, deadline
```

---

## PRICING (India SMB)

| Plan     | Price           | For whom             | Includes                                               |
| -------- | --------------- | -------------------- | ------------------------------------------------------ |
| Free     | ₹0              | Try it               | 10 entities, 1 connector, daily sync                   |
| Starter  | ₹999/mo ($12)   | Retail, freelancer   | 100 entities, 3 connectors, 4h sync                    |
| Growth   | ₹2,999/mo ($36) | Growing business     | 500 entities, 5 connectors, 1h sync, Twin triggers     |
| Business | ₹7,999/mo ($96) | Multi-location, team | 2000 entities, 10 connectors, 15min sync, all features |

Annual: 20% off (2 months free)

**Comparison:** Zoho One is ₹1,999/user/mo. Tally Prime is ₹18,000/year. IntegrateWise at ₹999/mo connects BOTH plus WhatsApp plus payments.

---

## DISTRIBUTION CHANNELS

| Channel                 | How                                              | Cost          |
| ----------------------- | ------------------------------------------------ | ------------- |
| WhatsApp groups         | Business owner groups, CA groups, trader groups  | Free          |
| CA / Accountant network | CAs recommend to 50+ clients each                | Revenue share |
| JustDial / IndiaMART    | Advertise as "business management tool"          | ₹5-10K/mo     |
| YouTube (Hindi)         | "How I run my business from one app" tutorials   | Free          |
| Instagram Reels         | Quick demos showing WhatsApp → Tally → Dashboard | Free          |
| Google Ads (Hindi)      | "business management app", "business app"        | ₹10-20K/mo    |
| Referral program        | ₹500 credit per referral                         | Variable      |
| Local business events   | Chamber of Commerce, trade associations          | Free          |

---

## TWIN TRIGGERS FOR SMB

Same 10 triggers, different context:

| Trigger             | Enterprise version               | SMB version                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| health_drop         | Account health dropped 15 points | Customer hasn't ordered in 30 days           |
| renewal_approaching | Contract renewal in 45 days      | Credit payment due in 7 days                 |
| engagement_drop     | No activity for 30 days          | Regular customer stopped placing orders      |
| arr_change          | ARR dropped 22%                  | Monthly sales down 20%                       |
| support_escalation  | 5+ open tickets                  | 3+ complaints on WhatsApp                    |
| signal_cluster      | Multiple signals firing          | Payment failed + order cancelled + complaint |
| context_gap         | High-value account, no context   | Big customer, no WhatsApp history linked     |
| stale_data          | Data older than 24h              | Tally not synced in 3 days                   |

---

## TIMELINE

| Week | What                                                          | Goal                |
| ---- | ------------------------------------------------------------- | ------------------- |
| 1    | Build Google Sheets connector + Razorpay wrapper              | 5 connectors ready  |
| 2    | India SMB onboarding flow + shop/service/professional schemas | Onboarding works    |
| 3    | Hindi landing page + WhatsApp group outreach                  | First 50 signups    |
| 4    | Tally connector + PhonePe connector                           | 7 connectors        |
| 5    | First 10 paying customers                                     | ₹10K MRR            |
| 6    | Telegram + Google My Business connectors                      | 9 connectors        |
| 8    | 50 paying customers                                           | ₹50K MRR            |
| 12   | Amazon + IndiaMART + Shiprocket                               | 12 India connectors |
| 16   | 200 paying customers                                          | ₹2L MRR             |

---

## THE BOTTOM LINE

Same Spine. Same Entity 360. Same Twin. Same Approval-Based Personal Memory.
Different connectors. Different schemas. Different price point.

Enterprise pays $999/mo for Salesforce + Zendesk integration.
Indian SMB pays ₹999/mo for WhatsApp + Tally + Razorpay integration.

Both get the same architecture. Both get Entity 360. Both get governed AI.
One pays in dollars. One pays in rupees. Both generate recurring revenue.
