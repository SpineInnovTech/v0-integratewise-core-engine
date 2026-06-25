-- ============================================================================
-- UNIVERSAL 360° ENTERPRISE SEED DATA (v11.8)
-- Purpose: Complete Digital Twin Simulation for any Product Firm
-- Scenario: "Global Finance Pro" - Expansion & Technical Debt Risk
-- ============================================================================
-- 0. SEED TENANT
INSERT
    OR IGNORE INTO tenants (id, name, slug)
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'IntegrateWise Demo Corp',
        'iw-demo'
    );
-- 1. ACCOUNT MASTER (The Entity)
INSERT INTO account_master (
        account_id,
        tenant_id,
        account_name,
        industry_vertical,
        arr,
        health_score,
        account_status,
        data_source
    )
VALUES (
        'acc_global_fin',
        '00000000-0000-0000-0000-000000000001',
        'Global Finance Pro',
        'Financial Services',
        1250000.00,
        72,
        'active',
        'salesforce'
    );
-- 2. PEOPLE & TEAM (The Human Layer)
INSERT INTO people_team (
        person_id,
        tenant_id,
        account_id,
        full_name,
        email,
        role,
        department,
        active_status
    )
VALUES (
        'p_sarah_cto',
        '00000000-0000-0000-0000-000000000001',
        'acc_global_fin',
        'Sarah Chen',
        'sarah.chen@globalfin.com',
        'Chief Technology Officer',
        'IT',
        'active'
    );
-- 3. STRATEGIC OBJECTIVES (The North Star)
INSERT INTO strategic_objectives (
        objective_id,
        tenant_id,
        account_id,
        strategic_pillar,
        objective_name,
        description,
        status,
        progress_percent
    )
VALUES (
        'obj_cloud_2024',
        '00000000-0000-0000-0000-000000000001',
        'acc_global_fin',
        'Digital Transformation',
        'Full Cloud Migration',
        'Migrate legacy on-prem payment gateway to Cloud Architecture by Q4.',
        'active',
        45
    );
-- 4. CAPABILITIES (Maturity)
INSERT INTO capabilities (
        capability_id,
        tenant_id,
        account_id,
        capability_name,
        current_maturity,
        target_maturity,
        priority
    )
VALUES (
        'cap_api_mgmt',
        '00000000-0000-0000-0000-000000000001',
        'acc_global_fin',
        'API Management Maturity',
        2,
        5,
        'high'
    );
-- 5. TECHNICAL PORTFOLIO (The Assets)
INSERT INTO technical_portfolio (
        asset_id,
        tenant_id,
        account_id,
        asset_name,
        asset_type,
        business_criticality,
        uptime_percent
    )
VALUES (
        'api_payment_gw',
        '00000000-0000-0000-0000-000000000001',
        'acc_global_fin',
        'Core Payment Processing API',
        'Service',
        'Mission Critical',
        99.85
    );
-- 6. RISK REGISTER (The Friction)
INSERT INTO risk_register (
        risk_id,
        tenant_id,
        account_id,
        risk_title,
        risk_category,
        impact_score,
        probability_score,
        risk_score,
        status
    )
VALUES (
        'risk_lat_spike',
        '00000000-0000-0000-0000-000000000001',
        'acc_global_fin',
        'Latency Degradation in Payment GW',
        'Technical',
        5,
        3,
        15,
        'identified'
    );
-- 7. INSIGHTS (The Intelligence)
INSERT INTO generated_insights (
        insight_id,
        tenant_id,
        account_id,
        insight_text,
        recommended_action,
        linked_risk_id,
        linked_objective_id
    )
VALUES (
        'ins_lat_obj_link',
        '00000000-0000-0000-0000-000000000001',
        'acc_global_fin',
        'Latency risk in Payment GW is directly jeopardizing the "Full Cloud Migration" objective.',
        'Accelerate Cloud Transformation Sprint 5 to replace legacy gateway.',
        'risk_lat_spike',
        'obj_cloud_2024'
    );
-- 8. ENGAGEMENT LOG (The Evidence)
INSERT INTO engagement_log (
        engagement_id,
        tenant_id,
        account_id,
        engagement_date,
        engagement_type,
        sentiment,
        topics_discussed
    )
VALUES (
        'eng_qbr_jan',
        '00000000-0000-0000-0000-000000000001',
        'acc_global_fin',
        '2024-01-15',
        'QBR',
        'neutral',
        'Discussed cloud roadmap, pointed out latency concerns in current batch processing.'
    );