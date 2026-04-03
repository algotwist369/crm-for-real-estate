## **Lead Outreach Automation Workflow (Email + WhatsApp)**
**CRM Module Proposal**

Build a **multi-channel lead communication automation system** inside the CRM that allows users to send **personalized WhatsApp or Email campaigns** to selected leads with **queue-based delivery, AI-assisted message variation, delay control, retry handling, and live campaign tracking**.

---

# **1) Core Objective**
Enable CRM users to send lead outreach messages through:

- **WhatsApp (Unofficial Integration)** → via **Baileys** or **whatsapp-web.js**
- **Email (SMTP / Custom Mail Configuration)**
The system should support:

-  Bulk lead selection 
-  Message templating 
-  AI-based content rewriting 
-  Controlled delay between each send 
-  Queue processing 
-  Real-time delivery status 
-  Retry mechanism 
-  Campaign analytics / reporting 
---

# **2) High-Level Workflow**
## **Step 1 — Select Communication Channel**
User starts a new campaign and selects one of the channels:

- **WhatsApp**
- **Email**
This creates a new **Outreach Campaign**.

---

# **3) WhatsApp Automation Workflow**
## **Step 2 — Connect WhatsApp Session**
If **WhatsApp** is selected:

-  User connects their WhatsApp account by scanning a **QR Code**
-  Authentication is handled through: 
    - **Baileys**, or 
    - **whatsapp-web.js**

-  Store session securely for future reuse 
-  Support: 
    -  Session reconnect 
    -  Session logout 
    -  Session expiry handling 
    -  Multi-user / multi-session support (if CRM is multi-tenant) 

### **WhatsApp Session States**
- `disconnected` 
- `qr_pending` 
- `connected` 
- `expired` 
- `reconnecting` 
---

## **Step 3 — Select Leads**
User selects leads from CRM database using:

-  Manual selection 
-  Bulk selection 
-  Filters such as: 
    -  Source 
    -  Status 
    -  City / Location 
    -  Assigned Agent 

Each selected lead should have required validation:

-  Valid phone number 
-  WhatsApp-compatible number 
---

## **Step 4 — Create Message Template**
User writes the **base WhatsApp message template**.

Example:

- `Hi {{name}}, thank you for your interest in {{project_name}}. Let me know if you'd like more details.` 
### **Supported Dynamic Variables**
- `{{name}}` 
- `{{phone}}` 
- `{{email}}` 
- `{{project_name}}` 
- `{{city}}` 
- `{{agent_name}}` 
- `{{company_name}}` 
This allows lead-specific personalization before sending.

---

## **Step 5 — AI-Based Message Variation**
Before dispatching each message:

-  Use **OpenAI** to **rewrite / paraphrase** the base template 
-  Keep: 
    - **same intent**
    - **same offer**
    - **same CTA**

-  Slightly vary wording for each lead to reduce repetitive identical messaging 
### **AI Rules**
-  Preserve placeholders / variables 
-  Keep message tone: 
    -  professional 
    -  friendly 
    -  sales-oriented 
    -  follow-up style 

-  Avoid spammy or unnatural language 
-  Optional: generate multiple variants in advance 
### **Example Flow**
Base template:

>  Hi {{name}}, I wanted to follow up regarding {{project_name}}. 

AI Output Variants:

-  Hello {{name}}, just checking in regarding your interest in {{project_name}}. 
-  Hi {{name}}, following up to see if you'd like more information about {{project_name}}. 
-  Hey {{name}}, reaching out again regarding {{project_name}} in case you'd like details. 
---

## **Step 6 — Configure Delivery Delay**
User sets **delay rules** between each message to simulate human-like sending behavior and reduce platform risk.

### **Delay Options**
-  Fixed delay
 Example: `30 seconds between each message` 
-  Randomized delay
 Example: `30–90 seconds` 
-  Batch pause (optional)
 Example: `Pause 5 minutes after every 20 messages` 
This configuration should be applied at **queue processing level**.

---

## **Step 7 — Queue the Campaign**
Once confirmed:

-  System generates one **message job per lead**
-  Jobs are pushed into a queue using: 
### **Recommended Queue Stack**
- **Redis + BullMQ** → Best for Node.js CRM 
-  OR 
- **RabbitMQ** → Better for distributed / service-based architecture 
### **Job Payload Example**
Each queue job may include:

-  campaignId 
-  leadId 
-  channel 
-  recipient 
-  renderedTemplate 
-  aiVariantMessage 
-  delayConfig 
-  retry Count 
-  sessionId / senderId 
---

## **Step 8 — Background Processing**
A worker service processes queued jobs asynchronously.

### **Processing Logic**
For each lead:

1.  Fetch lead data 
2.  Inject template variables 
3.  Generate / fetch AI-rewritten message 
4.  Wait according to delay rule 
5.  Send WhatsApp message 
6.  Capture delivery result 
7.  Update campaign + lead logs 
8.  Retry if failed (based on retry policy or user click manual) 
---

## **Step 9 — Delivery Status Tracking**
Every message should have a lifecycle status.

### **Message Status Flow**
- `queued` 
- `pending` 
- `processing` 
- `sent` 
- `failed` 
- `retrying` 
- `cancelled` 
- `invalid_number` 
- `session_disconnected` 
- `rate_limited` 
- `blocked` 
- `ai_generation_failed` 
This gives full operational visibility.

---

# **4) Email Automation Workflow**
The same campaign architecture should support **Email** as a second channel.

---

## **Step 2 — Add Email Configuration**
If **Email** is selected:

User adds their own sending configuration such as:

-  SMTP Host 
-  SMTP Port 
-  Username / Email 
-  Password / App Password 
-  Sender Name 
-  Reply-To Email 
### **Supported Providers**
-  Gmail SMTP 
-  Zoho Mail 
-  Outlook 
-  GoDaddy / Hostinger / cPanel Mail 
-  Custom SMTP 
Store credentials securely using:

-  encryption at rest 
-  masked UI display 
-  per-user config isolation 
---

## **Step 3 — Select Leads**
Same CRM lead selection flow as WhatsApp, but validate:

-  Valid email exists 
-  Email format is correct 
---

## **Step 4 — Create Email Template**
User writes:

- **Subject**
- **Email Body**
### **Email Template Features**
-  Rich text editor 
-  Variables / placeholders 
-  CTA button links 
-  Branding / signature support 
Example:

-  Subject: `Regarding your interest in {{project_name}}` 
-  Body: Personalized HTML email content 
---

## **Step 5 — Delay / Sending Rules**
Same as WhatsApp:

-  Delay between emails 
-  Random send interval 
-  Batch throttling 
-  Daily send limits (recommended) 
This is useful for:

-  SMTP stability 
-  avoiding spam filters 
-  inbox health 
---

## **Step 6 — Queue Email Jobs**
Each lead gets an email job queued using:

- **Redis + BullMQ**
-  or **RabbitMQ**
Worker sends emails in background and updates status.

---

## **Step 7 — Email Delivery Status**
Each email should track:

- `queued` 
- `processing` 
- `sent` 
- `failed` 
- `retrying` 
- `bounced`  (optional) 
- `opened`  (optional, if tracking enabled) 
- `clicked`  (optional, if tracking enabled) 
---

# **5) Unified Campaign Dashboard**
Both WhatsApp and Email campaigns should use the same **Campaign Monitoring Dashboard**.

---

## **Live Campaign Status Board**
Show real-time progress for each campaign:

-  Campaign Name 
-  Channel 
-  Total Leads 
-  Processed 
-  Sent 
-  Failed 
-  Retrying 
-  Pending 
-  Start Time 
-  End Time 
-  Created By 
---

# **6) Stats & Reporting**
## **Today’s Overview (with Custom Filters)**
Allow filters by:

-  Today 
-  Yesterday 
-  Last 7 Days 
-  Last 30 Days 
-  Custom Date Range 
-  Channel 
-  User 
-  Campaign 
### **Metrics**
- **Total Sent**
- **Total Queued / Pending**
- **Total Failed**
- **Total Retry**
- **Success Rate**
- **Failure Rate**
- **Average Send Time**
- **Campaign Completion %**
---

# **7) Recommended Technical Architecture**
## **Frontend**
-  React - Admin Panel 
-  Campaign Builder UI 
-  QR Connection UI 
-  Lead Selector 
-  Template Editor 
-  Queue Monitor Dashboard 
-  Stats & Analytics UI 
---

## **Backend**
### **Core Services**
- **Campaign Service**
- **Lead Service**
- **WhatsApp Session Service**
- **Email Config Service**
- **Template / AI Service**
- **Queue Worker Service**
- **Analytics / Reporting Service**
---

## **Queue & Background Jobs**
### **Recommended**
- **Redis + BullMQ**
    -  best for MERN stack 
    -  easy retry / delayed jobs / concurrency 

### **Alternative**
- **RabbitMQ**
    -  better if you want microservice/event-driven scaling later 

---

## **Database**
Use MongoDB collections such as:

- `campaigns` 
- `campaign_messages` 
- `whatsapp_sessions` 
- `email_configurations` 
- `message_templates` 
- `lead_activity_logs` 
- `queue_logs` 
---

# **8) Suggested Message Lifecycle Data Model**
## **Campaign**
-  campaignName 
-  channel (`whatsapp`  / `email` ) 
-  createdBy 
-  templateId 
-  totalLeads 
-  status 
-  delayConfig 
-  aiRewriteEnabled 
-  startedAt 
-  completedAt 
## **Campaign Message**
-  campaignId 
-  leadId 
-  recipient 
-  originalTemplate 
-  finalRenderedMessage 
-  aiGeneratedMessage 
-  status 
-  retryCount 
-  sentAt 
-  failedReason 
---

# **10) Final Professional Summary**
This CRM feature will function as a **multi-channel lead outreach automation engine** that allows users to:

-  connect their own **WhatsApp** or **Email**
-  select leads from CRM 
-  create dynamic message templates 
-  generate AI-personalized variations 
-  send messages through a **controlled queue system**
-  monitor each delivery in real time 
-  retry failed jobs automatically 
-  analyze performance through dashboard stats and reports 
It will help the business perform **bulk but personalized lead follow-up** in a structured, trackable, and scalable way.

