-- Migration: 047_spine_remaining_domains_intelligence.sql
-- Description: Remaining domain intelligence tables — Finance, Legal, HR, Engineering, Personal, BizOps
-- Created: 2026-03-11
-- =============================================================================

-- =============================================================================
-- FINANCE INTELLIGENCE (11 tables)
-- =============================================================================

-- =============================================================================
-- 1. PAYMENT LEDGER
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_payment_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'payment',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { invoice_id, payment_date, amount, currency, payment_method, transaction_id, status, failure_reason, processing_fee, net_amount, gateway, card_last_four, bank_name, reconciled, reconciled_date, gl_account, notes, external_payment_id }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_payment_ledger_account ON spine_payment_ledger((scope->>'account_id'));
CREATE INDEX idx_spine_payment_ledger_status ON spine_payment_ledger(((data->>'status')));
CREATE INDEX idx_spine_payment_ledger_invoice ON spine_payment_ledger(((data->>'invoice_id')));

-- =============================================================================
-- 2. SUBSCRIPTION BILLING
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_subscription_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'subscription_billing',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'revops', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { plan_name, plan_tier, status, billing_cycle, start_date, current_period_start, current_period_end, next_billing_date, mrr, arr, quantity, unit_price, currency, auto_renew, cancel_at_period_end, cancelled_date, cancellation_reason, trial_end_date, discount_percent, external_subscription_id }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_subscription_billing_account ON spine_subscription_billing((scope->>'account_id'));
CREATE INDEX idx_spine_subscription_billing_status ON spine_subscription_billing(((data->>'status')));

-- =============================================================================
-- 3. REVENUE RECOGNITION
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_revenue_recognition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'revenue_recognition',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { invoice_id, revenue_type, recognition_method, total_contract_value, recognized_amount, deferred_amount, recognition_start_date, recognition_end_date, period, asc606_category, performance_obligation, standalone_selling_price, allocation_percent, gl_account, status, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_revenue_recognition_account ON spine_revenue_recognition((scope->>'account_id'));
CREATE INDEX idx_spine_revenue_recognition_status ON spine_revenue_recognition(((data->>'status')));

-- =============================================================================
-- 4. EXPENSE TRACKER
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_expense_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'expense',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { department, category, description, vendor, amount, currency, expense_date, approval_status, approved_by, budget_line_item, po_number, receipt_url, recurring, frequency, gl_account, cost_center, submitted_by }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_expense_tracker_department ON spine_expense_tracker(((data->>'department')));
CREATE INDEX idx_spine_expense_tracker_approval ON spine_expense_tracker(((data->>'approval_status')));

-- =============================================================================
-- 5. BUDGETS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'budget',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { department, fiscal_year, fiscal_quarter, category, budget_name, allocated_amount, committed_amount, spent_amount, remaining_amount, utilization_percent, currency, status, owner, approved_by, approval_date, variance_percent, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_budgets_department ON spine_budgets(((data->>'department')));
CREATE INDEX idx_spine_budgets_status ON spine_budgets(((data->>'status')));

-- =============================================================================
-- 6. FINANCIAL FORECASTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_financial_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'financial_forecast',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { forecast_name, fiscal_year, fiscal_quarter, period_type, revenue_forecast, expense_forecast, net_income_forecast, cash_flow_forecast, confidence_level, model_type, assumptions, scenario, created_by, variance_to_actual_percent, status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_financial_forecasts_status ON spine_financial_forecasts(((data->>'status')));

-- =============================================================================
-- 7. TAX RECORDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'tax_record',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { invoice_id, tax_type, jurisdiction, tax_rate_percent, taxable_amount, tax_amount, currency, filing_period, filing_status, due_date, paid_date, tax_authority, reference_number, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_tax_records_account ON spine_tax_records((scope->>'account_id'));
CREATE INDEX idx_spine_tax_records_filing_status ON spine_tax_records(((data->>'filing_status')));

-- =============================================================================
-- 8. VENDOR PAYMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_vendor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'vendor_payment',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { vendor_name, vendor_id, invoice_number, amount, currency, payment_date, due_date, status, payment_method, category, department, approval_status, approved_by, gl_account, po_number, recurring, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_vendor_payments_status ON spine_vendor_payments(((data->>'status')));
CREATE INDEX idx_spine_vendor_payments_vendor ON spine_vendor_payments(((data->>'vendor_id')));

-- =============================================================================
-- 9. ACCOUNTS RECEIVABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'accounts_receivable',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { invoice_id, amount_due, amount_received, balance, currency, due_date, days_outstanding, aging_bucket, status, collection_status, last_contact_date, collector_assigned, payment_plan, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_accounts_receivable_account ON spine_accounts_receivable((scope->>'account_id'));
CREATE INDEX idx_spine_accounts_receivable_status ON spine_accounts_receivable(((data->>'status')));

-- =============================================================================
-- 10. ACCOUNTS PAYABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'accounts_payable',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { vendor_name, vendor_id, invoice_number, amount, currency, invoice_date, due_date, status, payment_priority, discount_available, discount_deadline, gl_account, approved_by, scheduled_payment_date, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_accounts_payable_status ON spine_accounts_payable(((data->>'status')));
CREATE INDEX idx_spine_accounts_payable_vendor ON spine_accounts_payable(((data->>'vendor_id')));

-- =============================================================================
-- 11. FINANCIAL METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'financial_metric',
    category VARCHAR(30) NOT NULL DEFAULT 'finance' CHECK (
        category IN ('finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { period, period_type, total_revenue, mrr, arr, net_revenue_retention, gross_revenue_retention, gross_margin_percent, operating_margin_percent, cash_runway_months, burn_rate, cac, ltv, ltv_cac_ratio, dso_days, quick_ratio, health_status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_financial_metrics_period ON spine_financial_metrics(((data->>'period')));
CREATE INDEX idx_spine_financial_metrics_health ON spine_financial_metrics(((data->>'health_status')));

-- =============================================================================
-- LEGAL INTELLIGENCE (12 tables)
-- =============================================================================

-- =============================================================================
-- 12. COMPLIANCE CHECKS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'compliance_check',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { framework, requirement_id, requirement_name, description, status, evidence_url, last_assessed_date, next_assessment_due, assessor, risk_if_non_compliant, remediation_plan, remediation_owner, remediation_due_date, control_type, frequency, department, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_compliance_checks_framework ON spine_compliance_checks(((data->>'framework')));
CREATE INDEX idx_spine_compliance_checks_status ON spine_compliance_checks(((data->>'status')));

-- =============================================================================
-- 13. LEGAL ENTITIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_legal_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'legal_entity',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { legal_name, entity_type_legal, jurisdiction, registration_number, tax_id, registered_address, parent_entity_id, status, formation_date, fiscal_year_end, registered_agent, directors, annual_filing_due, last_filing_date, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_legal_entities_status ON spine_legal_entities(((data->>'status')));
CREATE INDEX idx_spine_legal_entities_jurisdiction ON spine_legal_entities(((data->>'jurisdiction')));

-- =============================================================================
-- 14. NDAs
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_ndas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'nda',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { account_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { counterparty, nda_type, status, effective_date, expiration_date, duration_years, scope, permitted_disclosures, exclusions, signatory_customer, signatory_internal, document_url, linked_contract_id, owner, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_ndas_account ON spine_ndas((scope->>'account_id'));
CREATE INDEX idx_spine_ndas_status ON spine_ndas(((data->>'status')));

-- =============================================================================
-- 15. IP ASSETS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_ip_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'ip_asset',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { asset_name, ip_type, registration_number, jurisdiction, status, filing_date, registration_date, expiration_date, renewal_due, owner_entity, inventor_author, description, valuation_usd, licensing_status, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_ip_assets_status ON spine_ip_assets(((data->>'status')));
CREATE INDEX idx_spine_ip_assets_type ON spine_ip_assets(((data->>'ip_type')));

-- =============================================================================
-- 16. LITIGATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_litigation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'litigation',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { case_name, case_number, court_jurisdiction, case_type, status, filing_date, plaintiff, defendant, our_role, external_counsel, internal_lead, estimated_exposure_usd, actual_settlement_usd, key_dates, next_deadline, reserve_amount_usd, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_litigation_status ON spine_litigation(((data->>'status')));
CREATE INDEX idx_spine_litigation_case_type ON spine_litigation(((data->>'case_type')));

-- =============================================================================
-- 17. REGULATORY FILINGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_regulatory_filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'regulatory_filing',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { regulatory_body, filing_type, description, jurisdiction, due_date, filed_date, status, filing_reference, document_url, preparer, reviewer, approval_status, penalty_if_late_usd, filing_fee_usd, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_regulatory_filings_status ON spine_regulatory_filings(((data->>'status')));
CREATE INDEX idx_spine_regulatory_filings_body ON spine_regulatory_filings(((data->>'regulatory_body')));

-- =============================================================================
-- 18. POLICIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'policy',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { policy_name, category, version, status, effective_date, review_due_date, owner, approver, scope_description, summary, document_url, linked_compliance_framework, distribution_list, acknowledgement_required }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_policies_status ON spine_policies(((data->>'status')));
CREATE INDEX idx_spine_policies_name ON spine_policies(((data->>'policy_name')));

-- =============================================================================
-- 19. AMENDMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'amendment',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { contract_id, amendment_number, description, change_summary, effective_date, signed_date, financial_impact_usd, signatory_customer, signatory_internal, document_url, status, requested_by, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_amendments_contract ON spine_amendments(((data->>'contract_id')));
CREATE INDEX idx_spine_amendments_status ON spine_amendments(((data->>'status')));

-- =============================================================================
-- 20. LEGAL APPROVALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_legal_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'legal_approval',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { entity_type_ref, entity_id_ref, workflow_type, current_step, total_steps, status, requestor, current_approver, approval_chain, requested_date, decision_date, decision_reason, sla_hours, escalation_triggered, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_legal_approvals_status ON spine_legal_approvals(((data->>'status')));
CREATE INDEX idx_spine_legal_approvals_workflow ON spine_legal_approvals(((data->>'workflow_type')));

-- =============================================================================
-- 21. LEGAL RISK ASSESSMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_legal_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'legal_risk',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { category, risk_title, description, likelihood, impact, risk_score, risk_level, mitigation_strategy, mitigation_owner, status, related_contract_id, related_litigation_id, date_identified, review_date, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_legal_risk_assessments_status ON spine_legal_risk_assessments(((data->>'status')));
CREATE INDEX idx_spine_legal_risk_assessments_level ON spine_legal_risk_assessments(((data->>'risk_level')));

-- =============================================================================
-- 22. LEGAL METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_legal_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'legal_metric',
    category VARCHAR(30) NOT NULL DEFAULT 'legal' CHECK (
        category IN ('legal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { period, period_type, active_contracts, expiring_next_30_days, expiring_next_90_days, avg_contract_value, total_litigation_exposure, active_litigation_count, compliance_score_percent, overdue_filings, nda_coverage_percent, avg_contract_cycle_days, policy_review_compliance, ip_portfolio_value, health_status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_legal_metrics_period ON spine_legal_metrics(((data->>'period')));
CREATE INDEX idx_spine_legal_metrics_health ON spine_legal_metrics(((data->>'health_status')));

-- =============================================================================
-- HR INTELLIGENCE (13 tables)
-- =============================================================================

-- =============================================================================
-- 23. CANDIDATES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'candidate',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { full_name, email, phone, linkedin_url, resume_url, source, job_posting_id, stage, applied_date, stage_updated_date, days_in_stage, recruiter, hiring_manager, overall_score, culture_fit_score, technical_score, experience_years, current_company, current_title, expected_salary, rejection_reason, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_candidates_stage ON spine_candidates(((data->>'stage')));
CREATE INDEX idx_spine_candidates_email ON spine_candidates(((data->>'email')));

-- =============================================================================
-- 24. JOB POSTINGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'job_posting',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, department, team, location, remote_eligible, employment_type, seniority_level, description, requirements, nice_to_haves, salary_range_min, salary_range_max, currency, status, posted_date, close_date, hiring_manager, recruiter, applicant_count, source_system }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_job_postings_status ON spine_job_postings(((data->>'status')));
CREATE INDEX idx_spine_job_postings_department ON spine_job_postings(((data->>'department')));

-- =============================================================================
-- 25. INTERVIEWS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'interview',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { candidate_id, job_posting_id, interview_type, interviewer_name, interviewer_email, scheduled_date, duration_minutes, status, overall_rating, strengths, concerns, recommendation, feedback_notes, scorecard_url, decision, follow_up_required, submitted_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_interviews_candidate ON spine_interviews(((data->>'candidate_id')));
CREATE INDEX idx_spine_interviews_status ON spine_interviews(((data->>'status')));

-- =============================================================================
-- 26. ONBOARDING
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'onboarding',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { employee_id, task_name, category, status, assigned_to, due_date, completed_date, priority, dependencies, notes, template_id, day_number, buddy_assigned, manager_verified }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_onboarding_employee ON spine_onboarding(((data->>'employee_id')));
CREATE INDEX idx_spine_onboarding_status ON spine_onboarding(((data->>'status')));

-- =============================================================================
-- 27. PERFORMANCE REVIEWS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'performance_review',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { employee_id, review_period, review_type, self_rating, manager_rating, final_rating, rating_label, goals_met_percent, strengths, development_areas, key_accomplishments, goals_next_period, promotion_recommended, compensation_change_recommended, manager_id, calibration_group, status, due_date, completed_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_performance_reviews_employee ON spine_performance_reviews(((data->>'employee_id')));
CREATE INDEX idx_spine_performance_reviews_status ON spine_performance_reviews(((data->>'status')));

-- =============================================================================
-- 28. COMPENSATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_compensation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'compensation',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'finance', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { employee_id, effective_date, comp_type, amount, currency, frequency, reason, previous_amount, change_percent, approved_by, approval_date, comp_band, compa_ratio, stock_vesting_schedule, equity_shares, cliff_date, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_compensation_employee ON spine_compensation(((data->>'employee_id')));
CREATE INDEX idx_spine_compensation_type ON spine_compensation(((data->>'comp_type')));

-- =============================================================================
-- 29. LEAVE RECORDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_leave_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'leave',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { employee_id, leave_type, start_date, end_date, days_requested, days_approved, status, approved_by, reason, balance_before, balance_after, accrual_year, carryover_days, policy_name, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_leave_records_employee ON spine_leave_records(((data->>'employee_id')));
CREATE INDEX idx_spine_leave_records_status ON spine_leave_records(((data->>'status')));

-- =============================================================================
-- 30. TRAINING
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_training (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'training',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { program_name, category, description, format, duration_hours, provider, cost_per_person_usd, status, start_date, end_date, enrolled_count, completed_count, completion_rate_percent, avg_score, certification_earned, mandatory, department }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_training_status ON spine_training(((data->>'status')));
CREATE INDEX idx_spine_training_department ON spine_training(((data->>'department')));

-- =============================================================================
-- 31. TEAM STRUCTURE
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_team_structure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'team_structure',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { team_name, department, parent_team_id, team_lead_id, team_lead_name, headcount, open_positions, avg_tenure_months, avg_performance_rating, attrition_rate_percent, diversity_score, budget_usd, cost_center }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_team_structure_department ON spine_team_structure(((data->>'department')));
CREATE INDEX idx_spine_team_structure_name ON spine_team_structure(((data->>'team_name')));

-- =============================================================================
-- 32. ENGAGEMENT SURVEYS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_engagement_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'engagement_survey',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { survey_name, survey_type, period, status, sent_date, close_date, total_recipients, responses_received, response_rate_percent, overall_score, enps, top_strength_category, top_concern_category, department_breakdown, action_items, owner }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_engagement_surveys_status ON spine_engagement_surveys(((data->>'status')));
CREATE INDEX idx_spine_engagement_surveys_period ON spine_engagement_surveys(((data->>'period')));

-- =============================================================================
-- 33. HEADCOUNT PLANS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_headcount_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'headcount_plan',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { department, team, fiscal_year, fiscal_quarter, planned_headcount, current_headcount, open_positions, filled_this_quarter, avg_time_to_fill_days, budget_allocated_usd, budget_spent_usd, attrition_forecast, net_growth, approval_status, owner }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_headcount_plans_department ON spine_headcount_plans(((data->>'department')));
CREATE INDEX idx_spine_headcount_plans_approval ON spine_headcount_plans(((data->>'approval_status')));

-- =============================================================================
-- 34. HR METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_hr_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'hr_metric',
    category VARCHAR(30) NOT NULL DEFAULT 'hr' CHECK (
        category IN ('hr', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { period, period_type, total_headcount, new_hires, terminations, voluntary_attrition_rate, involuntary_attrition_rate, avg_time_to_fill_days, offer_acceptance_rate, avg_tenure_months, training_hours_per_employee, engagement_score, enps, diversity_index, compensation_competitiveness, open_positions, health_status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_hr_metrics_period ON spine_hr_metrics(((data->>'period')));
CREATE INDEX idx_spine_hr_metrics_health ON spine_hr_metrics(((data->>'health_status')));

-- =============================================================================
-- ENGINEERING INTELLIGENCE (13 tables)
-- =============================================================================

-- =============================================================================
-- 35. ENGINEERING PROJECTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_eng_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'eng_project',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { project_name, project_key, description, status, methodology, start_date, target_end_date, actual_end_date, project_lead, product_owner, team_size, department, repository_url, board_url, epic_count, sprint_count, completion_percent, budget_usd, spent_usd, priority, source_system }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_eng_projects_status ON spine_eng_projects(((data->>'status')));
CREATE INDEX idx_spine_eng_projects_key ON spine_eng_projects(((data->>'project_key')));

-- =============================================================================
-- 36. SPRINTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'sprint',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { project_id, sprint_name, sprint_number, goal, status, start_date, end_date, duration_days, story_points_committed, story_points_completed, velocity, completion_rate_percent, issues_total, issues_completed, issues_carried_over, bugs_found, bugs_fixed, retrospective_notes, source_system }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_sprints_project ON spine_sprints(((data->>'project_id')));
CREATE INDEX idx_spine_sprints_status ON spine_sprints(((data->>'status')));

-- =============================================================================
-- 37. ISSUES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'issue',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { project_id, issue_key, title, description, type, status, priority, severity, assignee, reporter, sprint_id, epic_id, story_points, labels, components, affected_version, fix_version, environment, steps_to_reproduce, acceptance_criteria, due_date, resolved_date, resolution, external_issue_id, source_system }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_issues_project ON spine_issues(((data->>'project_id')));
CREATE INDEX idx_spine_issues_status ON spine_issues(((data->>'status')));
CREATE INDEX idx_spine_issues_assignee ON spine_issues(((data->>'assignee')));

-- =============================================================================
-- 38. PULL REQUESTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_pull_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'pull_request',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { repository, pr_number, title, description, author, status, branch_source, branch_target, files_changed, lines_added, lines_removed, commits_count, reviewers, approvals_count, approvals_required, review_comments_count, ci_status, merged_date, cycle_time_hours, linked_issues, source_system }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_pull_requests_status ON spine_pull_requests(((data->>'status')));
CREATE INDEX idx_spine_pull_requests_author ON spine_pull_requests(((data->>'author')));

-- =============================================================================
-- 39. DEPLOYMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'deployment',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { service_name, version, environment, status, trigger_type, deployed_by, start_time, end_time, duration_seconds, commit_sha, pr_id, change_summary, rollback_of, health_check_status, incidents_post_deploy, artifacts_url, pipeline_id, approval_required, approved_by }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_deployments_status ON spine_deployments(((data->>'status')));
CREATE INDEX idx_spine_deployments_service ON spine_deployments(((data->>'service_name')));
CREATE INDEX idx_spine_deployments_environment ON spine_deployments(((data->>'environment')));

-- =============================================================================
-- 40. SERVICE HEALTH
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_service_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'service_health',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { service_name, environment, status, uptime_percent_30d, avg_response_time_ms, p95_response_time_ms, p99_response_time_ms, error_rate_percent, request_rate_per_second, cpu_usage_percent, memory_usage_percent, disk_usage_percent, active_connections, health_check_url, last_health_check, alert_count_24h, dependencies, sla_target_uptime, owner_team }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_service_health_service ON spine_service_health(((data->>'service_name')));
CREATE INDEX idx_spine_service_health_status ON spine_service_health(((data->>'status')));

-- =============================================================================
-- 41. ARCHITECTURE DECISIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_architecture_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'architecture_decision',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, status, context, decision, consequences, alternatives_considered, date_decided, decided_by, superseded_by, tags, linked_services, linked_projects, document_url, review_date, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_architecture_decisions_status ON spine_architecture_decisions(((data->>'status')));

-- =============================================================================
-- 42. TECH DEBT
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_tech_debt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'tech_debt',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, description, category, severity, affected_service, estimated_effort_days, business_impact, risk_if_unresolved, status, priority, owner, target_resolution_date, resolved_date, linked_issue_id, linked_incident_id, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_tech_debt_status ON spine_tech_debt(((data->>'status')));
CREATE INDEX idx_spine_tech_debt_severity ON spine_tech_debt(((data->>'severity')));

-- =============================================================================
-- 43. CODE REVIEWS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_code_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'code_review',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { pr_id, reviewer, author, status, review_type, comments_count, issues_found, blocking_issues, start_date, completed_date, time_to_review_hours, files_reviewed, approval_given, quality_score, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_code_reviews_status ON spine_code_reviews(((data->>'status')));
CREATE INDEX idx_spine_code_reviews_reviewer ON spine_code_reviews(((data->>'reviewer')));

-- =============================================================================
-- 44. RELEASES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'release',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { release_name, version, status, release_type, target_date, actual_date, release_manager, features_count, bugs_fixed_count, breaking_changes, release_notes_url, rollback_plan, sign_off_required, sign_off_by, deployment_ids, linked_sprint_ids, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_releases_status ON spine_releases(((data->>'status')));
CREATE INDEX idx_spine_releases_version ON spine_releases(((data->>'version')));

-- =============================================================================
-- 45. CI/CD PIPELINES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_ci_cd_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'ci_cd_pipeline',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { pipeline_name, repository, branch_pattern, trigger_type, status, last_run_status, last_run_date, last_run_duration_seconds, avg_duration_seconds, success_rate_percent, stages, artifacts_produced, test_coverage_percent, security_scan_enabled, deploy_target, owner_team }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_ci_cd_pipelines_status ON spine_ci_cd_pipelines(((data->>'status')));
CREATE INDEX idx_spine_ci_cd_pipelines_repo ON spine_ci_cd_pipelines(((data->>'repository')));

-- =============================================================================
-- 46. INFRASTRUCTURE
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_infrastructure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'infrastructure',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { asset_name, asset_type, provider, region, environment, status, instance_type, cpu_cores, memory_gb, storage_gb, monthly_cost_usd, tags, owner_team, provisioned_date, last_patched, monitoring_enabled, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_infrastructure_status ON spine_infrastructure(((data->>'status')));
CREATE INDEX idx_spine_infrastructure_type ON spine_infrastructure(((data->>'asset_type')));
CREATE INDEX idx_spine_infrastructure_provider ON spine_infrastructure(((data->>'provider')));

-- =============================================================================
-- 47. ENGINEERING METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_engineering_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'engineering_metric',
    category VARCHAR(30) NOT NULL DEFAULT 'engineering' CHECK (
        category IN ('engineering', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { period, period_type, deployment_frequency, lead_time_hours, change_failure_rate_percent, mttr_hours, velocity_avg, sprint_completion_rate, code_coverage_percent, open_bugs, critical_bugs, tech_debt_items, incident_count, p1_incidents, avg_pr_review_hours, avg_pr_cycle_hours, uptime_percent, on_call_pages, health_status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_engineering_metrics_period ON spine_engineering_metrics(((data->>'period')));
CREATE INDEX idx_spine_engineering_metrics_health ON spine_engineering_metrics(((data->>'health_status')));

-- =============================================================================
-- PERSONAL WORKSPACE (13 tables)
-- =============================================================================

-- =============================================================================
-- 48. PERSONAL DASHBOARD
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_personal_dashboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'personal_dashboard',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { layout_config, active_widgets, focus_mode_enabled, today_priority, week_theme, pinned_goals, pinned_projects, quick_links, notification_preferences, timezone }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_personal_dashboard_owner ON spine_personal_dashboard((scope->>'owner_id'));

-- =============================================================================
-- 49. PERSONAL TASKS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_personal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'personal_task',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, description, status, priority, due_date, due_time, reminder_date, recurrence, project_id, goal_id, context_tag, energy_level, estimated_minutes, actual_minutes, completed_date, source, external_id, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_personal_tasks_owner ON spine_personal_tasks((scope->>'owner_id'));
CREATE INDEX idx_spine_personal_tasks_status ON spine_personal_tasks(((data->>'status')));

-- =============================================================================
-- 50. CALENDAR EVENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'calendar_event',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, description, start_time, end_time, all_day, location, meeting_url, attendees, organizer, status, recurrence_rule, calendar_source, color_tag, reminder_minutes, travel_time_minutes, prep_notes, action_items_post, external_event_id }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_calendar_events_owner ON spine_calendar_events((scope->>'owner_id'));
CREATE INDEX idx_spine_calendar_events_start ON spine_calendar_events(((data->>'start_time')));

-- =============================================================================
-- 51. NOTES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'note',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, content, format, tags, folder, pinned, archived, color_label, word_count, linked_project_id, linked_meeting_id, source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_notes_owner ON spine_notes((scope->>'owner_id'));
CREATE INDEX idx_spine_notes_folder ON spine_notes(((data->>'folder')));

-- =============================================================================
-- 52. PERSONAL GOALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_personal_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'personal_goal',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, description, category, goal_type, target_value, current_value, unit, target_date, status, progress_percent, key_results, review_frequency, last_review_date, motivation }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_personal_goals_owner ON spine_personal_goals((scope->>'owner_id'));
CREATE INDEX idx_spine_personal_goals_status ON spine_personal_goals(((data->>'status')));

-- =============================================================================
-- 53. HABITS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'habit',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { habit_name, description, category, frequency, target_per_period, current_streak, longest_streak, total_completions, completion_rate_percent, start_date, status, reminder_time, linked_goal_id, last_completed }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_habits_owner ON spine_habits((scope->>'owner_id'));
CREATE INDEX idx_spine_habits_status ON spine_habits(((data->>'status')));

-- =============================================================================
-- 54. BOOKMARKS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'bookmark',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { title, url, description, tags, folder, favicon_url, highlight_text, source_type, read_status, added_date, last_accessed, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_bookmarks_owner ON spine_bookmarks((scope->>'owner_id'));
CREATE INDEX idx_spine_bookmarks_folder ON spine_bookmarks(((data->>'folder')));

-- =============================================================================
-- 55. JOURNAL
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'journal_entry',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { date, title, content, mood, energy_level, gratitude_items, wins, challenges, tomorrow_intentions, tags, word_count }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_journal_owner ON spine_journal((scope->>'owner_id'));
CREATE INDEX idx_spine_journal_date ON spine_journal(((data->>'date')));

-- =============================================================================
-- 56. PERSONAL CONTACTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_personal_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'personal_contact',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { full_name, email, phone, company, title, relationship, tags, last_interaction_date, interaction_frequency, birthday, linkedin_url, notes, introduced_by, follow_up_date, status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_personal_contacts_owner ON spine_personal_contacts((scope->>'owner_id'));
CREATE INDEX idx_spine_personal_contacts_email ON spine_personal_contacts(((data->>'email')));

-- =============================================================================
-- 57. PERSONAL PROJECTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_personal_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'personal_project',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { project_name, description, status, category, priority, start_date, target_end_date, actual_end_date, completion_percent, tasks_total, tasks_completed, collaborators, repository_url, notes_url, linked_goal_id }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_personal_projects_owner ON spine_personal_projects((scope->>'owner_id'));
CREATE INDEX idx_spine_personal_projects_status ON spine_personal_projects(((data->>'status')));

-- =============================================================================
-- 58. TIME LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'time_log',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { date, start_time, end_time, duration_minutes, activity, category, project_id, task_id, energy_level, productivity_rating, interruptions_count, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_time_logs_owner ON spine_time_logs((scope->>'owner_id'));
CREATE INDEX idx_spine_time_logs_date ON spine_time_logs(((data->>'date')));

-- =============================================================================
-- 59. PERSONAL METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_personal_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'personal_metric',
    category VARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (
        category IN ('personal')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { period, period_type, tasks_completed, goals_progress_avg, habits_completion_rate, deep_work_hours, meeting_hours, total_tracked_hours, journal_entries, notes_created, focus_score, energy_score_avg, streak_active_count, health_status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_personal_metrics_owner ON spine_personal_metrics((scope->>'owner_id'));
CREATE INDEX idx_spine_personal_metrics_period ON spine_personal_metrics(((data->>'period')));

-- =============================================================================
-- BIZOPS / IW CONSOLE (12 tables)
-- =============================================================================

-- =============================================================================
-- 60. ORGANIZATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'organization',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { org_name, legal_name, industry, sub_industry, employee_count, founded_year, website, hq_country, hq_city, billing_email, plan_tier, subscription_status, arr, mrr, onboarding_status, admin_count, active_users, integrations_connected }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_organization_name ON spine_organization(((data->>'org_name')));
CREATE INDEX idx_spine_organization_status ON spine_organization(((data->>'subscription_status')));

-- =============================================================================
-- 61. DEPARTMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'department',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { department_name, parent_department_id, head_id, head_name, headcount, budget_usd, cost_center, location, status, created_date }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_departments_name ON spine_departments(((data->>'department_name')));
CREATE INDEX idx_spine_departments_status ON spine_departments(((data->>'status')));

-- =============================================================================
-- 62. INTEGRATION REGISTRY
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_integration_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'integration',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { connector_id, connector_name, provider, category, status, connected_date, last_sync_at, next_sync_at, entities_synced, sync_frequency, error_count_24h, api_calls_24h, rate_limit_remaining, health_status, config_version, owner }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_integration_registry_status ON spine_integration_registry(((data->>'status')));
CREATE INDEX idx_spine_integration_registry_health ON spine_integration_registry(((data->>'health_status')));

-- =============================================================================
-- 63. WORKFLOWS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'workflow',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { workflow_name, description, trigger_type, trigger_config, steps, status, execution_count, last_executed_at, avg_execution_time_ms, success_rate_percent, error_rate_percent, owner, tags, version }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_workflows_status ON spine_workflows(((data->>'status')));
CREATE INDEX idx_spine_workflows_name ON spine_workflows(((data->>'workflow_name')));

-- =============================================================================
-- 64. RBAC POLICIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_rbac_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'rbac_policy',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { policy_name, role, permissions, resource_type, resource_scope, conditions, status, created_by, approved_by, effective_date, expiry_date, notes }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_rbac_policies_role ON spine_rbac_policies(((data->>'role')));
CREATE INDEX idx_spine_rbac_policies_status ON spine_rbac_policies(((data->>'status')));

-- =============================================================================
-- 65. AUDIT LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'audit_entry',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { team_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { actor_id, actor_name, actor_type, action, entity_type_ref, entity_id_ref, field_changed, old_value, new_value, ip_address, user_agent, reason, correlation_id }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_audit_log_actor ON spine_audit_log(((data->>'actor_id')));
CREATE INDEX idx_spine_audit_log_action ON spine_audit_log(((data->>'action')));
CREATE INDEX idx_spine_audit_log_entity ON spine_audit_log(((data->>'entity_type_ref')));

-- =============================================================================
-- 66. SYSTEM HEALTH
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'system_health',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { service_name, component, status, uptime_percent, response_time_ms, error_rate_percent, cpu_percent, memory_percent, disk_percent, active_connections, queue_depth, last_checked, alert_count, region }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_system_health_service ON spine_system_health(((data->>'service_name')));
CREATE INDEX idx_spine_system_health_status ON spine_system_health(((data->>'status')));

-- =============================================================================
-- 67. USER ACTIVITY
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'user_activity',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { user_id, user_name, action_type, module, page, session_id, duration_seconds, ip_address, device, browser, country, timestamp }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_user_activity_user ON spine_user_activity(((data->>'user_id')));
CREATE INDEX idx_spine_user_activity_action ON spine_user_activity(((data->>'action_type')));

-- =============================================================================
-- 68. NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'notification',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('personal', 'business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    -- Structure: { owner_id }
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { recipient_id, title, body, type, channel, priority, status, read_at, action_url, source_entity_type, source_entity_id, sent_at, expires_at }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_notifications_owner ON spine_notifications((scope->>'owner_id'));
CREATE INDEX idx_spine_notifications_recipient ON spine_notifications(((data->>'recipient_id')));
CREATE INDEX idx_spine_notifications_status ON spine_notifications(((data->>'status')));

-- =============================================================================
-- 69. APPROVAL QUEUE
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'approval_item',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { entity_type_ref, entity_id_ref, action_requested, requestor_id, requestor_name, approver_id, approver_name, status, priority, sla_hours, requested_at, decided_at, decision_reason, escalated }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_approval_queue_status ON spine_approval_queue(((data->>'status')));
CREATE INDEX idx_spine_approval_queue_approver ON spine_approval_queue(((data->>'approver_id')));

-- =============================================================================
-- 70. PLATFORM USAGE
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_platform_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'platform_usage',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { period, period_type, active_users, dau, wau, mau, sessions, avg_session_duration, page_views, api_calls, storage_used_gb, bandwidth_gb, integrations_active, modules_used, feature_adoption, health_status }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_platform_usage_period ON spine_platform_usage(((data->>'period')));
CREATE INDEX idx_spine_platform_usage_health ON spine_platform_usage(((data->>'health_status')));

-- =============================================================================
-- 71. BIZOPS METRICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS spine_bizops_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'bizops_metric',
    category VARCHAR(30) NOT NULL DEFAULT 'business' CHECK (
        category IN ('business')
    ),
    scope JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { metric_category, metric_name, current_value, target_value, previous_value, change_percent, unit, period, period_type, department, trend_direction, health_status, data_source }
    relationships JSONB NOT NULL DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spine_bizops_metrics_name ON spine_bizops_metrics(((data->>'metric_name')));
CREATE INDEX idx_spine_bizops_metrics_health ON spine_bizops_metrics(((data->>'health_status')));

-- =============================================================================
-- SPINE STREAMS — Add missing domain streams
-- =============================================================================
INSERT INTO spine_streams (id, tenant_id, stream_key, display_name, description, category, scope) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'hr', 'People & Culture', 'Hiring, performance, compensation, engagement', 'team', '{"visibility": "team"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'legal', 'Legal', 'Contracts, compliance, IP, litigation', 'business', '{"visibility": "org"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'personal', 'Personal', 'Individual productivity, goals, habits', 'team', '{"visibility": "private"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'bizops', 'Business Operations', 'Organization, integrations, workflows, RBAC', 'business', '{"visibility": "org"}'::jsonb)
ON CONFLICT (tenant_id, stream_key) DO NOTHING;

-- =============================================================================
-- END
-- =============================================================================
