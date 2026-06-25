-- ============================================================================
-- D1 SPINE SEED DATA
-- Purpose: Populate Layer 2 (Cognitive Intel) for UI Demo
-- ============================================================================
-- 0. SEED TENANT
INSERT
    OR IGNORE INTO tenants (id, name, slug)
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'IntegrateWise Demo Corp',
        'iw-demo'
    );
-- 1. SEED EVIDENCE REFERENCES
-- Evidence for a "Churn Risk" situation
INSERT INTO evidence_refs (
        id,
        tenant_id,
        source_plane,
        source_type,
        source_id,
        display_label,
        trust_level,
        summary
    )
VALUES (
        'ev_1',
        '00000000-0000-0000-0000-000000000001',
        'structured',
        'event',
        'stripe_churn_signal',
        'Unpaid Invoice - Stripe',
        'high',
        'Customer invoice #INV-2024-001 has been unpaid for 14 days.'
    ),
    (
        'ev_2',
        '00000000-0000-0000-0000-000000000001',
        'unstructured',
        'file',
        'qbr_doc_id',
        'QBR Notes - Jan 2024',
        'medium',
        'Mentions "budget restrains" and "exploring alternatives" on page 4.'
    ),
    (
        'ev_3',
        '00000000-0000-0000-0000-000000000001',
        'chat',
        'session_memory',
        'cx_chat_id',
        'Slack Interaction - Support',
        'model_inferred',
        'Sentiment analysis shows "highly frustrated" regarding performance issues.'
    );
-- 2. SEED SIGNALS
INSERT INTO signals (
        id,
        tenant_id,
        signal_key,
        entity_type,
        entity_id,
        metric_value,
        metric_unit,
        band,
        evidence_ref_ids
    )
VALUES (
        'sig_health_drop',
        '00000000-0000-0000-0000-000000000001',
        'account_health',
        'account',
        'acc_acme_corp',
        35,
        '%',
        'critical',
        '["ev_1", "ev_2", "ev_3"]'
    );
-- 3. SEED SITUATIONS
INSERT INTO situations (
        id,
        tenant_id,
        situation_key,
        title,
        summary,
        severity,
        status,
        signal_ids,
        evidence_ref_ids
    )
VALUES (
        'sit_churn_risk',
        '00000000-0000-0000-0000-000000000001',
        'risk.churn.high',
        'Critical Retention Risk: Acme Corp',
        'Acme Corp shows multiple signals of imminent churn including financial delinquency and negative sentiment in QBRs.',
        'critical',
        'open',
        '["sig_health_drop"]',
        '["ev_1", "ev_2", "ev_3"]'
    );
-- 4. SEED ACTION PROPOSALS
INSERT INTO action_proposals (
        id,
        tenant_id,
        situation_id,
        proposal_rank,
        action_type,
        parameters,
        autonomy_level,
        confidence_score,
        evidence_ref_ids
    )
VALUES (
        'prop_discount',
        '00000000-0000-0000-0000-000000000001',
        'sit_churn_risk',
        1,
        'retention.apply_loyalty_discount',
        '{"discount_percent": 15, "duration_months": 3}',
        'semi_auto',
        0.85,
        '["ev_1"]'
    ),
    (
        'prop_exec_outreach',
        '00000000-0000-0000-0000-000000000001',
        'sit_churn_risk',
        2,
        'crm.schedule_exec_sync',
        '{"exec_level": "VP", "urgency": "high"}',
        'manual',
        0.92,
        '["ev_2", "ev_3"]'
    );
-- 5. SEED AUDIT LOGS
INSERT INTO audit_logs (
        id,
        tenant_id,
        actor_id,
        actor_type,
        action,
        entity_type,
        entity_id,
        metadata
    )
VALUES (
        'alog_1',
        '00000000-0000-0000-0000-000000000001',
        'iq-hub-agent',
        'agent',
        'brainstorm.situation_created',
        'situation',
        'sit_churn_risk',
        '{"logic_version": "v11.4", "trigger": "health_threshold_breach"}'
    );