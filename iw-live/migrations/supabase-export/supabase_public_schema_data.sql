--
-- PostgreSQL database dump
--

\restrict m6CEbg717Dw3kzFrH64d3WLcdbDcB2oNW46dJzKSgz2AeX7czU8fVBHWrGcEHtc

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: broadcast_table_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.broadcast_table_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    TG_TABLE_SCHEMA || ':' || TG_TABLE_NAME || ':' || COALESCE(NEW.id::text, OLD.id::text),
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: get_tenant_context(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_tenant_context() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;


--
-- Name: search_brainstorm_sessions(public.vector, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_brainstorm_sessions(query_embedding public.vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10) RETURNS TABLE(id uuid, title text, description text, session_type character varying, status character varying, source character varying, session_date timestamp with time zone, similarity double precision)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    bs.id,
    bs.title,
    bs.description,
    bs.session_type,
    bs.status,
    bs.source,
    bs.session_date,
    1 - (bs.embedding <=> query_embedding) AS similarity
  FROM brainstorm_sessions bs
  WHERE bs.embedding IS NOT NULL
    AND 1 - (bs.embedding <=> query_embedding) > match_threshold
  ORDER BY bs.embedding <=> query_embedding
  LIMIT match_count;
$$;


--
-- Name: search_documents(public.vector, double precision, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_documents(query_embedding public.vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10, filter_category text DEFAULT NULL::text) RETURNS TABLE(id uuid, title text, content text, category character varying, description text, similarity double precision, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.category,
    d.description,
    1 - (d.embedding <=> query_embedding) AS similarity,
    d.created_at
  FROM documents d
  WHERE 
    d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR d.category = filter_category)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


--
-- Name: search_interactions(public.vector, double precision, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_interactions(query_embedding public.vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10, filter_source text DEFAULT NULL::text) RETURNS TABLE(id uuid, content text, source character varying, title text, source_url text, similarity double precision, created_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.content,
    i.source,
    i.title,
    i.source_url,
    1 - (i.embedding <=> query_embedding) AS similarity,
    i.created_at,
    i.metadata
  FROM interactions i
  WHERE 
    i.embedding IS NOT NULL
    AND 1 - (i.embedding <=> query_embedding) > match_threshold
    AND (filter_source IS NULL OR i.source = filter_source)
  ORDER BY i.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


--
-- Name: set_tenant_context(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_tenant_context(tenant_uuid uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_uuid::text, false);
END;
$$;


--
-- Name: universal_search(public.vector, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.universal_search(query_embedding public.vector, match_threshold double precision DEFAULT 0.6, match_count integer DEFAULT 20) RETURNS TABLE(id uuid, content_type character varying, title text, content_preview text, similarity double precision, created_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 
      i.id,
      'interaction'::VARCHAR(50) AS content_type,
      COALESCE(i.title, LEFT(i.content, 100)) AS title,
      LEFT(i.content, 300) AS content_preview,
      1 - (i.embedding <=> query_embedding) AS similarity,
      i.created_at,
      jsonb_build_object('source', i.source, 'source_url', i.source_url) AS metadata
    FROM interactions i
    WHERE i.embedding IS NOT NULL
      AND 1 - (i.embedding <=> query_embedding) > match_threshold
  )
  UNION ALL
  (
    SELECT 
      d.id,
      'document'::VARCHAR(50) AS content_type,
      d.title,
      LEFT(d.content, 300) AS content_preview,
      1 - (d.embedding <=> query_embedding) AS similarity,
      d.created_at,
      jsonb_build_object('category', d.category, 'description', d.description) AS metadata
    FROM documents d
    WHERE d.embedding IS NOT NULL
      AND 1 - (d.embedding <=> query_embedding) > match_threshold
  )
  UNION ALL
  (
    SELECT 
      e.id,
      'email'::VARCHAR(50) AS content_type,
      e.subject AS title,
      LEFT(COALESCE(e.body, e.preview), 300) AS content_preview,
      1 - (e.embedding <=> query_embedding) AS similarity,
      e.received_at AS created_at,
      jsonb_build_object('sender', e.sender_name, 'folder', e.folder) AS metadata
    FROM emails e
    WHERE e.embedding IS NOT NULL
      AND 1 - (e.embedding <=> query_embedding) > match_threshold
  )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_type character varying(50) NOT NULL,
    title text NOT NULL,
    description text,
    icon character varying(50),
    color character varying(20) DEFAULT 'teal'::character varying,
    related_entity_type character varying(50),
    related_entity_id uuid,
    actor_name text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: brainstorm_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brainstorm_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    insight_type character varying(30) NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    priority character varying(10) DEFAULT 'medium'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    confidence_score numeric(3,2) DEFAULT 0.75,
    target_date date,
    assigned_to text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    executed_at timestamp with time zone,
    result_id uuid,
    result_type character varying(30)
);


--
-- Name: brainstorm_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brainstorm_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    participants text[] DEFAULT '{}'::text[],
    session_type character varying(30) DEFAULT 'general'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    context text,
    key_insights text[],
    action_items text[],
    embedding public.vector(1536),
    source character varying(50) DEFAULT 'manual'::character varying,
    source_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    session_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: business_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    goal_type character varying(30) NOT NULL,
    period_type character varying(20) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    target_value numeric(12,2),
    current_value numeric(12,2) DEFAULT 0,
    target_unit character varying(20),
    currency character varying(3) DEFAULT 'INR'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    progress integer DEFAULT 0,
    parent_goal_id uuid,
    linked_products uuid[] DEFAULT '{}'::uuid[],
    linked_services uuid[] DEFAULT '{}'::uuid[],
    owner text,
    priority character varying(10) DEFAULT 'high'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    event_type character varying(50) DEFAULT 'meeting'::character varying,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    location text,
    attendees text[] DEFAULT '{}'::text[],
    color character varying(20) DEFAULT 'teal'::character varying,
    is_all_day boolean DEFAULT false,
    recurrence_rule text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type character varying(30) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    description text,
    target_audience text,
    channel character varying(30),
    budget numeric(12,2),
    currency character varying(3) DEFAULT 'INR'::character varying,
    start_date date,
    end_date date,
    sent_count integer DEFAULT 0,
    opened_count integer DEFAULT 0,
    clicked_count integer DEFAULT 0,
    leads_generated integer DEFAULT 0,
    conversions integer DEFAULT 0,
    revenue_generated numeric(12,2) DEFAULT 0,
    content jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: chat_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform character varying(20) NOT NULL,
    platform_id text NOT NULL,
    name text NOT NULL,
    type character varying(20),
    guild_id text,
    team_id text,
    topic text,
    member_count integer DEFAULT 0,
    is_archived boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: chat_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform character varying(20) NOT NULL,
    enabled boolean DEFAULT false,
    config jsonb DEFAULT '{}'::jsonb,
    slack_team_id text,
    slack_team_name text,
    slack_bot_token text,
    slack_signing_secret text,
    discord_guild_id text,
    discord_guild_name text,
    discord_bot_token text,
    discord_public_key text,
    discord_application_id text,
    sync_messages boolean DEFAULT true,
    sync_channels boolean DEFAULT true,
    sync_users boolean DEFAULT true,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform character varying(20) NOT NULL,
    platform_id text NOT NULL,
    channel_id text,
    channel_name text,
    guild_id text,
    team_id text,
    user_id text,
    user_name text,
    content text,
    thread_id text,
    is_bot boolean DEFAULT false,
    attachments jsonb DEFAULT '[]'::jsonb,
    reactions jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: chat_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform character varying(20) NOT NULL,
    platform_id text NOT NULL,
    username text,
    display_name text,
    email text,
    avatar_url text,
    is_bot boolean DEFAULT false,
    is_admin boolean DEFAULT false,
    status character varying(20),
    timezone text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_engagements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_engagements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    product_id uuid,
    name text NOT NULL,
    type character varying(30) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    start_date date,
    end_date date,
    value numeric(12,2),
    currency character varying(3) DEFAULT 'INR'::character varying,
    billing_cycle character varying(20),
    hours_allocated integer,
    hours_used integer DEFAULT 0,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    engagement_id uuid,
    name text NOT NULL,
    description text,
    type character varying(30) NOT NULL,
    status character varying(20) DEFAULT 'planning'::character varying,
    priority character varying(10) DEFAULT 'medium'::character varying,
    start_date date,
    target_date date,
    completion_date date,
    progress integer DEFAULT 0,
    github_repo text,
    vercel_project_id text,
    staging_url text,
    production_url text,
    tech_stack text[],
    team_members text[],
    estimated_hours integer,
    actual_hours integer DEFAULT 0,
    budget numeric(12,2),
    spent numeric(12,2) DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    company text NOT NULL,
    email text,
    phone text,
    website text,
    industry character varying(50),
    size character varying(20),
    status character varying(20) DEFAULT 'active'::character varying,
    tier character varying(20),
    logo_url text,
    address text,
    city text,
    country character varying(50) DEFAULT 'India'::character varying,
    primary_contact text,
    primary_contact_title text,
    hubspot_id text,
    pipedrive_id text,
    stripe_customer_id text,
    total_revenue numeric(12,2) DEFAULT 0,
    lifetime_value numeric(12,2) DEFAULT 0,
    health_score integer DEFAULT 100,
    nps_score integer,
    tags text[] DEFAULT '{}'::text[],
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    onboarded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: company_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon character varying(50),
    color character varying(20),
    principles text[],
    examples text[],
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: content_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    type character varying(30) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    category character varying(50),
    description text,
    content text,
    thumbnail_url text,
    file_url text,
    platform character varying(30),
    scheduled_at timestamp with time zone,
    published_at timestamp with time zone,
    views integer DEFAULT 0,
    engagement integer DEFAULT 0,
    shares integer DEFAULT 0,
    tags text[] DEFAULT '{}'::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: conversion_funnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversion_funnel (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visitor_id text NOT NULL,
    stage character varying(30) NOT NULL,
    previous_stage character varying(30),
    page_id uuid,
    form_id uuid,
    lead_id uuid,
    deal_id uuid,
    client_id uuid,
    source text,
    campaign text,
    revenue_attributed numeric(12,2) DEFAULT 0,
    converted_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: daily_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    insight_date date NOT NULL,
    summary text NOT NULL,
    key_actions text[] DEFAULT '{}'::text[],
    metrics_snapshot jsonb DEFAULT '{}'::jsonb,
    brainstorm_count integer DEFAULT 0,
    tasks_created integer DEFAULT 0,
    content_generated integer DEFAULT 0,
    pipeline_updates integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: data_source_sync; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_source_sync (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source character varying(50) NOT NULL,
    sync_type character varying(50),
    status character varying(50) DEFAULT 'pending'::character varying,
    records_fetched integer DEFAULT 0,
    records_created integer DEFAULT 0,
    records_updated integer DEFAULT 0,
    records_failed integer DEFAULT 0,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    error_message text,
    error_details jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT data_source_sync_source_check CHECK (((source)::text = ANY ((ARRAY['hubspot'::character varying, 'pipedrive'::character varying, 'stripe'::character varying, 'google_sheets'::character varying, 'google_analytics'::character varying, 'asana'::character varying, 'linkedin'::character varying, 'razorpay'::character varying])::text[]))),
    CONSTRAINT data_source_sync_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying])::text[]))),
    CONSTRAINT data_source_sync_sync_type_check CHECK (((sync_type)::text = ANY ((ARRAY['full'::character varying, 'incremental'::character varying, 'webhook'::character varying])::text[])))
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    lead_id uuid,
    product_id uuid,
    stage character varying(30) DEFAULT 'discovery'::character varying,
    value numeric(12,2),
    currency character varying(3) DEFAULT 'INR'::character varying,
    probability integer DEFAULT 10,
    expected_close_date date,
    actual_close_date date,
    assigned_to text,
    source character varying(50),
    notes text,
    hubspot_deal_id text,
    pipedrive_deal_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    environment character varying(20) NOT NULL,
    version text,
    status character varying(20) DEFAULT 'pending'::character varying,
    deployed_by text,
    deployed_at timestamp with time zone,
    commit_sha text,
    commit_message text,
    build_time_seconds integer,
    url text,
    logs text,
    rollback_version text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category character varying(100) NOT NULL,
    description text,
    icon character varying(50) DEFAULT 'FileText'::character varying,
    embedding public.vector(1536),
    is_starred boolean DEFAULT false,
    view_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: drive_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drive_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    file_type character varying(50) NOT NULL,
    mime_type text,
    size_bytes bigint,
    parent_folder_id uuid,
    file_url text,
    thumbnail_url text,
    is_starred boolean DEFAULT false,
    is_shared boolean DEFAULT false,
    shared_with text[] DEFAULT '{}'::text[],
    embedding public.vector(1536),
    content_preview text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject text NOT NULL,
    sender_name text NOT NULL,
    sender_email text NOT NULL,
    preview text,
    body text,
    folder character varying(50) DEFAULT 'inbox'::character varying,
    is_read boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    has_attachments boolean DEFAULT false,
    thread_id uuid,
    embedding public.vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb,
    received_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid,
    page_id uuid,
    lead_id uuid,
    visitor_id text,
    session_id text,
    data jsonb NOT NULL,
    source text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    referrer text,
    ip_address text,
    user_agent text,
    country text,
    city text,
    synced_to_hubspot boolean DEFAULT false,
    hubspot_contact_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: goal_progress_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_progress_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    goal_id uuid,
    recorded_at timestamp with time zone DEFAULT now(),
    progress_value numeric(12,2),
    progress_percentage integer,
    notes text,
    recorded_by text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hubspot_sync_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hubspot_sync_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sync_type character varying(30) NOT NULL,
    direction character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    records_processed integer DEFAULT 0,
    records_created integer DEFAULT 0,
    records_updated integer DEFAULT 0,
    records_failed integer DEFAULT 0,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    error_message text,
    error_details jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content text NOT NULL,
    source character varying(50) NOT NULL,
    source_url text,
    title text,
    embedding public.vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid,
    type character varying(50) NOT NULL,
    subject character varying(255),
    description text,
    campaign_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    performed_by character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lead_activities_type_check CHECK (((type)::text = ANY ((ARRAY['email_sent'::character varying, 'email_opened'::character varying, 'email_clicked'::character varying, 'email_replied'::character varying, 'call_made'::character varying, 'call_received'::character varying, 'voicemail'::character varying, 'meeting_scheduled'::character varying, 'meeting_completed'::character varying, 'meeting_cancelled'::character varying, 'linkedin_connection'::character varying, 'linkedin_message'::character varying, 'linkedin_viewed'::character varying, 'website_visit'::character varying, 'form_submission'::character varying, 'document_viewed'::character varying, 'note_added'::character varying, 'task_created'::character varying, 'status_changed'::character varying, 'score_changed'::character varying])::text[])))
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    company text,
    title text,
    source character varying(50) DEFAULT 'website'::character varying,
    source_detail text,
    status character varying(30) DEFAULT 'new'::character varying,
    score integer DEFAULT 0,
    tags text[] DEFAULT '{}'::text[],
    linkedin_url text,
    hubspot_id text,
    pipedrive_id text,
    assigned_to text,
    notes text,
    last_contacted_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_name character varying(100) NOT NULL,
    metric_value numeric(15,2) NOT NULL,
    metric_unit character varying(20),
    currency character varying(10) DEFAULT 'INR'::character varying,
    period_start date,
    period_end date,
    change_percentage numeric(5,2),
    change_direction character varying(10),
    metadata jsonb DEFAULT '{}'::jsonb,
    recorded_at timestamp with time zone DEFAULT now()
);


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    service_id uuid,
    name character varying(255) NOT NULL,
    value numeric(12,2),
    currency character varying(10) DEFAULT 'INR'::character varying,
    stage character varying(50) DEFAULT 'discovery'::character varying,
    probability integer DEFAULT 10,
    expected_close_date date,
    owner character varying(255),
    source character varying(100),
    notes text,
    lost_reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT opportunities_probability_check CHECK (((probability >= 0) AND (probability <= 100)))
);


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_id uuid,
    visitor_id text,
    session_id text,
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    time_on_page integer DEFAULT 0,
    scroll_depth integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    tier integer NOT NULL,
    tier_name character varying(100) NOT NULL,
    category character varying(100),
    pricing_model character varying(50) NOT NULL,
    price_min numeric(12,2),
    price_max numeric(12,2),
    currency character varying(10) DEFAULT 'INR'::character varying,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    icon character varying(50),
    color character varying(50),
    features jsonb DEFAULT '[]'::jsonb,
    deliverables jsonb DEFAULT '[]'::jsonb,
    ideal_for text,
    external_url text,
    sort_order integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT products_tier_check CHECK (((tier >= 1) AND (tier <= 5)))
);


--
-- Name: project_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_milestones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    name text NOT NULL,
    description text,
    due_date date,
    completed_date date,
    status character varying(20) DEFAULT 'pending'::character varying,
    deliverables text[],
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    service_id uuid,
    name character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'discovery'::character varying,
    stage character varying(50),
    start_date date,
    end_date date,
    contract_value numeric(12,2),
    currency character varying(10) DEFAULT 'INR'::character varying,
    billing_type character varying(50),
    health_score integer,
    owner character varying(255),
    tags text[] DEFAULT ARRAY[]::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT projects_health_score_check CHECK (((health_score >= 1) AND (health_score <= 10)))
);


--
-- Name: revenue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revenue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    project_id uuid,
    subscription_id uuid,
    service_id uuid,
    tier integer,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying,
    type character varying(50) NOT NULL,
    invoice_number character varying(100),
    invoice_date date,
    payment_date date,
    payment_status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: revenue_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revenue_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(50),
    amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying,
    status character varying(50),
    client_id uuid,
    project_id uuid,
    product_id uuid,
    stripe_id character varying(255),
    razorpay_id character varying(255),
    invoice_number character varying(100),
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    transaction_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT revenue_transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT revenue_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['payment'::character varying, 'refund'::character varying, 'subscription'::character varying, 'invoice'::character varying])::text[])))
);


--
-- Name: roi_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roi_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(30) NOT NULL,
    entity_id uuid NOT NULL,
    entity_name text,
    period_start date NOT NULL,
    period_end date NOT NULL,
    investment numeric(12,2) DEFAULT 0,
    revenue_generated numeric(12,2) DEFAULT 0,
    leads_generated integer DEFAULT 0,
    deals_closed integer DEFAULT 0,
    customers_acquired integer DEFAULT 0,
    roi_percentage numeric(8,2),
    notes text,
    linked_goal_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tier integer NOT NULL,
    tier_name character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    pricing_type character varying(50) NOT NULL,
    price_min numeric(12,2),
    price_max numeric(12,2),
    currency character varying(10) DEFAULT 'INR'::character varying,
    modules jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT services_tier_check CHECK (((tier >= 1) AND (tier <= 6)))
);


--
-- Name: session_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    type character varying(20) DEFAULT 'note'::character varying,
    content text NOT NULL,
    assigned_to text,
    due_date date,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    priority character varying(10) DEFAULT 'medium'::character varying,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    engagement_id uuid,
    title text NOT NULL,
    type character varying(30) NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 60,
    location text,
    attendees text[],
    agenda text,
    summary text,
    feedback_rating integer,
    feedback_text text,
    recording_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    service_id uuid,
    plan_name character varying(100),
    modules text[] DEFAULT ARRAY[]::text[],
    mrr numeric(12,2) NOT NULL,
    arr numeric(12,2),
    currency character varying(10) DEFAULT 'INR'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    billing_cycle character varying(20) DEFAULT 'monthly'::character varying,
    start_date date NOT NULL,
    renewal_date date,
    cancellation_date date,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    priority character varying(20) DEFAULT 'medium'::character varying,
    status character varying(20) DEFAULT 'todo'::character varying,
    due_date date,
    assignee text,
    tags text[] DEFAULT '{}'::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tools_registry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tools_registry (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category character varying(30) NOT NULL,
    tool_type character varying(30),
    vendor text,
    url text,
    icon character varying(50),
    status character varying(20) DEFAULT 'active'::character varying,
    integration_status character varying(20) DEFAULT 'not_connected'::character varying,
    api_connected boolean DEFAULT false,
    webhook_url text,
    monthly_cost numeric(10,2),
    currency character varying(3) DEFAULT 'USD'::character varying,
    used_by text[],
    linked_goals uuid[] DEFAULT '{}'::uuid[],
    features text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: webhook_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel character varying(20) NOT NULL,
    notification_type character varying(30) NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    metrics jsonb DEFAULT '{}'::jsonb,
    recommendations text[],
    alerts text[],
    status character varying(20) DEFAULT 'pending'::character varying,
    slack_response jsonb,
    discord_response jsonb,
    error_message text,
    triggered_by character varying(30) DEFAULT 'cron'::character varying,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: webhook_scheduler_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_scheduler_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel character varying(20) NOT NULL,
    webhook_url text NOT NULL,
    is_enabled boolean DEFAULT true,
    frequency character varying(20) DEFAULT 'hourly'::character varying,
    include_metrics boolean DEFAULT true,
    include_recommendations boolean DEFAULT true,
    include_alerts boolean DEFAULT true,
    include_roi boolean DEFAULT true,
    alert_threshold_pipeline numeric(12,2) DEFAULT 100000,
    alert_threshold_health integer DEFAULT 70,
    last_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider character varying(50) NOT NULL,
    event_type character varying(100) NOT NULL,
    event_id character varying(255),
    payload jsonb NOT NULL,
    signature text,
    signature_valid boolean DEFAULT true,
    processed boolean DEFAULT false,
    processed_at timestamp with time zone,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: website_forms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.website_forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    form_type character varying(30) NOT NULL,
    page_id uuid,
    status character varying(20) DEFAULT 'active'::character varying,
    fields jsonb DEFAULT '[]'::jsonb,
    submissions_count integer DEFAULT 0,
    conversion_rate numeric(5,2) DEFAULT 0,
    connected_to character varying(50),
    hubspot_form_id text,
    webhook_url text,
    thank_you_message text,
    redirect_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: website_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.website_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    page_type character varying(30) DEFAULT 'page'::character varying,
    status character varying(20) DEFAULT 'draft'::character varying,
    content text,
    meta_title text,
    meta_description text,
    featured_image text,
    template character varying(50) DEFAULT 'default'::character varying,
    author text,
    published_at timestamp with time zone,
    scheduled_at timestamp with time zone,
    views integer DEFAULT 0,
    unique_visitors integer DEFAULT 0,
    avg_time_on_page integer DEFAULT 0,
    bounce_rate numeric(5,2) DEFAULT 0,
    conversions integer DEFAULT 0,
    seo_score integer DEFAULT 0,
    tags text[] DEFAULT '{}'::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: website_visitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.website_visitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visitor_id text NOT NULL,
    first_visit timestamp with time zone DEFAULT now(),
    last_visit timestamp with time zone DEFAULT now(),
    total_visits integer DEFAULT 1,
    total_pageviews integer DEFAULT 0,
    total_time_seconds integer DEFAULT 0,
    lead_id uuid,
    client_id uuid,
    email text,
    name text,
    company text,
    country text,
    city text,
    device_type character varying(20),
    browser character varying(50),
    os character varying(50),
    first_referrer text,
    first_utm_source text,
    first_utm_campaign text,
    lifecycle_stage character varying(30) DEFAULT 'visitor'::character varying,
    hubspot_contact_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activities (id, activity_type, title, description, icon, color, related_entity_type, related_entity_id, actor_name, metadata, created_at) FROM stdin;
883d6241-3f75-4987-86bb-faa33092ad11	task_completed	Completed: Client proposal review	Finished reviewing the TechCorp proposal	CheckCircle	green	task	\N	Rechetts	{}	2025-12-17 22:14:23.105225+00
99433dda-d171-4958-88f0-1d49d15d6789	email_received	New email from John Smith	Re: Project Proposal Review	Mail	blue	email	\N	John Smith	{}	2025-12-17 22:14:23.105225+00
6092617c-71c0-4b62-b0d5-ee35166323d3	document_updated	Updated Sales Playbook	Added new objection handling scripts	FileText	teal	document	\N	Rechetts	{}	2025-12-17 22:14:23.105225+00
dbf002bd-8b34-4e4f-b2c1-bca972316f29	meeting_scheduled	Scheduled: Q4 Review Meeting	Tomorrow at 2:00 PM	Calendar	purple	calendar_event	\N	System	{}	2025-12-17 22:14:23.105225+00
0769969e-9448-4484-94d3-9a39cb20f22b	file_uploaded	Uploaded: Q4 Revenue Forecast	New spreadsheet added to Drive	Upload	orange	drive_file	\N	Rechetts	{}	2025-12-17 22:14:23.105225+00
6505f3fc-0252-4974-a098-33f89ec91b0f	interaction_captured	Captured: ChatGPT conversation	Pricing strategy research saved	MessageSquare	teal	interaction	\N	System	{}	2025-12-17 22:14:23.105225+00
\.


--
-- Data for Name: brainstorm_insights; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brainstorm_insights (id, session_id, insight_type, title, content, priority, status, confidence_score, target_date, assigned_to, metadata, created_at, executed_at, result_id, result_type) FROM stdin;
\.


--
-- Data for Name: brainstorm_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brainstorm_sessions (id, title, description, participants, session_type, status, context, key_insights, action_items, embedding, source, source_url, metadata, session_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: business_goals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_goals (id, title, description, goal_type, period_type, period_start, period_end, target_value, current_value, target_unit, currency, status, progress, parent_goal_id, linked_products, linked_services, owner, priority, metadata, created_at, updated_at) FROM stdin;
b8d243c2-d896-46b0-9c5f-8d09ce825fac	Q1 2025 Revenue Target	Achieve total revenue of 1 Crore in Q1 2025	revenue	quarterly	2025-01-01	2025-03-31	10000000.00	2500000.00	currency	INR	active	25	\N	{}	{}	Nirmal Prince	high	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
73f85398-73d2-489b-a99b-2e0be31d6893	Launch Template Forge AI	Complete development and launch Template Forge AI SaaS	product	quarterly	2025-01-01	2025-03-31	100.00	35.00	percentage	INR	active	35	\N	{}	{}	Nirmal Prince	high	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
ebd1b04a-73d2-4c6e-9227-d1bb612e4fce	Acquire 10 New Clients	Sign 10 new consulting or advisory clients	customer	quarterly	2025-01-01	2025-03-31	10.00	3.00	number	INR	active	30	\N	{}	{}	Nirmal Prince	high	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
1d988222-fa61-479b-861c-eb14f8b4b51d	Grow LinkedIn to 15K	Increase LinkedIn followers to 15,000	growth	quarterly	2025-01-01	2025-03-31	15000.00	12500.00	number	INR	active	83	\N	{}	{}	Nirmal Prince	medium	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
c8e3ee3a-7b9a-4adf-8b24-b9745196dd3c	Community to 500 Members	Grow Integration Architects Community to 500 active members	growth	quarterly	2025-01-01	2025-03-31	500.00	280.00	number	INR	active	56	\N	{}	{}	Nirmal Prince	medium	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
e13cc05f-f5bc-4dd6-b5e7-3c19ef454c41	MRR Target 5L	Achieve Monthly Recurring Revenue of 5 Lakhs	revenue	quarterly	2025-01-01	2025-03-31	500000.00	180000.00	currency	INR	active	36	\N	{}	{}	Nirmal Prince	high	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
d54cc665-79be-4eaa-a13f-0180348f5024	FY 2025 Revenue	Achieve annual revenue of 5 Crores	revenue	annual	2025-01-01	2025-12-31	50000000.00	2500000.00	currency	INR	active	5	\N	{}	{}	Nirmal Prince	high	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
6b2e1d03-9065-43ed-af50-719a01d524a7	Launch 3 SaaS Products	Complete and launch Template Forge AI, Normalize AI, and AI Agent Suite	product	annual	2025-01-01	2025-12-31	3.00	0.00	number	INR	active	0	\N	{}	{}	Nirmal Prince	high	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
611046b5-0d70-497a-afad-3e6b284f9073	50 Active Clients	Build client base to 50 active engagements	customer	annual	2025-01-01	2025-12-31	50.00	8.00	number	INR	active	16	\N	{}	{}	Nirmal Prince	high	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
\.


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.calendar_events (id, title, description, event_type, start_time, end_time, location, attendees, color, is_all_day, recurrence_rule, metadata, created_at, updated_at) FROM stdin;
c9734f16-09d5-48a0-84de-f3e03eebfde3	Team Standup	Daily sync with the team	meeting	2025-12-17 09:00:00+00	2025-12-17 09:30:00+00	Google Meet	{Team}	teal	f	\N	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
749f27c0-09cd-4503-8dc2-a3aceae73382	Client Discovery Call	Initial call with potential client	call	2025-12-17 11:00:00+00	2025-12-17 12:00:00+00	Zoom	{Rechetts,Client}	blue	f	\N	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
be1514b6-a20a-4235-8fdf-e6727fdd2a84	Lunch Break	Break time	break	2025-12-17 13:00:00+00	2025-12-17 14:00:00+00	\N	{}	gray	f	\N	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
120cab5c-db37-4382-ab8d-3e70d8eb2e37	Deep Work - Strategy	Focus time for strategy work	focus	2025-12-17 14:00:00+00	2025-12-17 16:00:00+00	\N	{Rechetts}	purple	f	\N	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
cc36b9e7-744b-44a0-bc3e-7f3e587eff79	Sales Pipeline Review	Weekly pipeline review	meeting	2025-12-17 16:30:00+00	2025-12-17 17:30:00+00	Office	{"Sales Team"}	teal	f	\N	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
df45b806-b8d1-451b-905d-ad4ad871b3ac	Project Alpha Kickoff	New project kickoff meeting	meeting	2025-12-18 10:00:00+00	2025-12-18 11:30:00+00	Google Meet	{Rechetts,"Dev Team",Client}	green	f	\N	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campaigns (id, name, type, status, description, target_audience, channel, budget, currency, start_date, end_date, sent_count, opened_count, clicked_count, leads_generated, conversions, revenue_generated, content, metadata, created_at, updated_at) FROM stdin;
c3bc67ad-f236-47d2-beac-96c943efc32a	MuleSoft Decision Makers Q4	email	active	Targeted campaign for MuleSoft architects and decision makers	CTOs, VPs Engineering, Integration Architects	email	50000.00	INR	2024-10-01	2024-12-31	2500	875	312	45	8	2500000.00	{}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
a00af635-8690-464f-a998-c2cea1745503	LinkedIn Thought Leadership	social	active	Daily posts on integration best practices and MuleSoft tips	Tech leaders, Integration professionals	linkedin	25000.00	INR	2024-01-01	2024-12-31	365	45000	8500	120	15	1800000.00	{}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
72cc8173-d8d7-4e59-a86c-5e73b4fa81cd	Integration Excellence Webinar Series	webinar	active	Monthly webinars on integration architecture patterns	Integration Architects, Tech Leads	webinar	100000.00	INR	2024-01-01	2024-12-31	12	1800	450	85	12	3500000.00	{}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
75444ca2-0746-4b00-ae75-9ebb472b3f7b	Template Forge AI Launch	product_launch	scheduled	Launch campaign for Template Forge AI SaaS product	MuleSoft developers, Integration teams	multi-channel	200000.00	INR	2025-01-15	2025-02-28	0	0	0	0	0	0.00	{}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
a83267aa-f889-451c-bc76-7e9bfe520b0f	Customer Success Automation Guide	content	completed	Downloadable guide on CS automation with lead capture	Customer Success leaders, CS Ops	website	15000.00	INR	2024-08-01	2024-09-30	500	425	180	65	5	1200000.00	{}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
f91d20f7-044b-4ed0-a8fc-3bd61c545672	Founders Coaching Outreach	outbound	active	Direct outreach to funded startup founders	Startup founders, First-time CTOs	email	30000.00	INR	2024-11-01	2024-12-31	800	320	95	28	3	600000.00	{}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
c7a640e3-bf6c-4340-a8e2-b047233274c4	Integration Architects Community	community	active	Growing the free community with premium upsell	Integration professionals worldwide	community	10000.00	INR	2024-01-01	2024-12-31	0	0	0	250	45	900000.00	{}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
1dc588e1-6716-427a-b23b-79f8a1196069	Normalize AI Beta Program	beta	draft	Beta user acquisition for Normalize AI product	Data engineers, ETL specialists	multi-channel	75000.00	INR	2025-02-01	2025-03-31	0	0	0	0	0	0.00	{}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
\.


--
-- Data for Name: chat_channels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_channels (id, platform, platform_id, name, type, guild_id, team_id, topic, member_count, is_archived, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_integrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_integrations (id, platform, enabled, config, slack_team_id, slack_team_name, slack_bot_token, slack_signing_secret, discord_guild_id, discord_guild_name, discord_bot_token, discord_public_key, discord_application_id, sync_messages, sync_channels, sync_users, last_sync_at, created_at, updated_at) FROM stdin;
ddcdd757-0515-478f-9de0-cb0e142663a6	slack	f	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	t	t	\N	2025-12-19 22:51:51.956367+00	2025-12-19 22:51:51.956367+00
0a6a1057-75fa-4bfa-9e37-4d33bb779f17	discord	f	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	t	t	\N	2025-12-19 22:51:51.956367+00	2025-12-19 22:51:51.956367+00
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, platform, platform_id, channel_id, channel_name, guild_id, team_id, user_id, user_name, content, thread_id, is_bot, attachments, reactions, metadata, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: chat_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_users (id, platform, platform_id, username, display_name, email, avatar_url, is_bot, is_admin, status, timezone, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: client_engagements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_engagements (id, client_id, product_id, name, type, status, start_date, end_date, value, currency, billing_cycle, hours_allocated, hours_used, notes, metadata, created_at, updated_at) FROM stdin;
c2f1d29c-9de4-489e-8252-d6698617f03c	52067e2c-2fe1-44e0-aff4-7681878d7951	\N	MuleSoft Architecture Consulting	consulting	active	2024-10-01	2025-03-31	7500000.00	INR	milestone	200	85	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
c2db7835-7fbb-42ac-9be4-671d2b76407a	fd708bfb-e077-422a-9935-c73df44fb5e3	\N	CTO Advisory Retainer	advisory	active	2024-11-01	2025-04-30	6000000.00	INR	monthly	40	28	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
ae7a0174-03e8-403f-86f5-936112ce639f	525f3202-b6fb-4efc-99ce-e16bfc96e6c9	\N	Customer Success Automation	consulting	active	2024-12-01	2025-02-28	1800000.00	INR	milestone	80	25	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
24bf7d7f-0547-410a-a5f8-ff96989c032e	b632e7ef-5c5e-4ca1-9ec2-36ed5b8de5e3	\N	Integration Foundation Setup	consulting	active	2024-12-15	2025-02-15	1000000.00	INR	milestone	60	0	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
721cf30c-b2d0-47b3-aa71-51fc5910cb58	09df561b-4e65-409c-9330-7a05d85cf193	\N	Foundation Package	consulting	active	2024-11-15	2025-01-31	1000000.00	INR	milestone	50	32	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
\.


--
-- Data for Name: client_projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_projects (id, client_id, engagement_id, name, description, type, status, priority, start_date, target_date, completion_date, progress, github_repo, vercel_project_id, staging_url, production_url, tech_stack, team_members, estimated_hours, actual_hours, budget, spent, metadata, created_at, updated_at) FROM stdin;
f1daeeba-91f5-41b7-8b7e-8a7f42a629bc	52067e2c-2fe1-44e0-aff4-7681878d7951	c2f1d29c-9de4-489e-8252-d6698617f03c	API Gateway Implementation	Implement centralized API gateway with MuleSoft	mulesoft	in_progress	high	2024-11-01	2025-01-31	\N	45	https://github.com/techcorp/api-gateway	\N	https://api-staging.techcorp.in	\N	{MuleSoft,CloudHub,"API Manager"}	{"Nirmal Prince","Rajesh Kumar"}	120	54	4500000.00	2025000.00	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
486546e5-3b23-4aa4-a6d7-ae497ade8b55	525f3202-b6fb-4efc-99ce-e16bfc96e6c9	ae7a0174-03e8-403f-86f5-936112ce639f	CS Workflow Automation	Automate customer success workflows with n8n and custom integrations	automation	in_progress	high	2024-12-10	2025-02-15	\N	20	https://github.com/insurepro/cs-automation	\N	https://cs-staging.insurepro.com	\N	{n8n,Node.js,PostgreSQL,Salesforce}	{"Nirmal Prince","David Miller"}	60	12	1200000.00	240000.00	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
c6ca04b7-b3f6-424a-ad26-91f38407a9fc	fd708bfb-e077-422a-9935-c73df44fb5e3	\N	Integration Dashboard	Custom dashboard for monitoring all integrations	saas	planning	medium	2025-01-15	2025-03-31	\N	0	\N	\N	\N	\N	{Next.js,Supabase,Vercel}	{"Nirmal Prince"}	80	0	800000.00	0.00	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
65f994f8-4283-45e1-aa4e-11b13b815ee0	52067e2c-2fe1-44e0-aff4-7681878d7951	\N	MuleSoft API Platform Implementation	Enterprise-wide API management and integration platform	mulesoft	in_progress	high	2024-10-01	2025-03-31	\N	0	\N	\N	\N	\N	\N	{"Nirmal Prince"}	\N	0	8500000.00	0.00	{}	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
72f70cad-5629-41f1-ad00-2afab14fa09b	7357e9f9-b8d0-4856-ba66-9ffb04c31566	\N	MuleSoft API Platform Implementation	Enterprise-wide API management and integration platform	mulesoft	in_progress	high	2024-10-01	2025-03-31	\N	0	\N	\N	\N	\N	\N	{"Nirmal Prince"}	\N	0	8500000.00	0.00	{}	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
aa3a5b11-f919-4c9f-b2a9-56a5c0204a66	0a1b74a2-77ba-4283-82ca-f6a8e93394f3	\N	CS Platform Setup	Customer success tooling and process implementation	automation	in_progress	high	2024-11-15	2025-02-28	\N	0	\N	\N	\N	\N	\N	{"Nirmal Prince"}	\N	0	1800000.00	0.00	{}	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
86ad9c07-a72a-4bef-84a2-8956a8870e99	6bb10836-8f76-4e25-badd-73d02501c736	\N	Integration Strategy Advisory	Monthly strategic advisory and architecture guidance	integration	in_progress	medium	2024-09-01	\N	\N	0	\N	\N	\N	\N	\N	{"Nirmal Prince"}	\N	0	750000.00	0.00	{}	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, name, company, email, phone, website, industry, size, status, tier, logo_url, address, city, country, primary_contact, primary_contact_title, hubspot_id, pipedrive_id, stripe_customer_id, total_revenue, lifetime_value, health_score, nps_score, tags, notes, metadata, onboarded_at, created_at, updated_at) FROM stdin;
52067e2c-2fe1-44e0-aff4-7681878d7951	Rajesh Kumar	TechCorp India	rajesh@techcorp.in	\N	\N	Technology	enterprise	active	enterprise	\N	\N	\N	India	Rajesh Kumar	CTO	\N	\N	\N	7500000.00	0.00	95	\N	{mulesoft,consulting}	\N	{}	\N	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
fd708bfb-e077-422a-9935-c73df44fb5e3	Sarah Johnson	GlobalTech Inc	sarah@globaltech.com	\N	\N	Technology	enterprise	active	advisory	\N	\N	\N	India	Sarah Johnson	Director of Integration	\N	\N	\N	6000000.00	0.00	90	\N	{cto-advisory,retainer}	\N	{}	\N	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
525f3202-b6fb-4efc-99ce-e16bfc96e6c9	David Miller	InsurePro	david@insurepro.com	\N	\N	Insurance	mid-market	active	growth	\N	\N	\N	India	David Miller	CTO	\N	\N	\N	1800000.00	0.00	85	\N	{cs-automation}	\N	{}	\N	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
b632e7ef-5c5e-4ca1-9ec2-36ed5b8de5e3	Vikram Reddy	HealthPlus	vikram@healthplus.in	\N	\N	Healthcare	enterprise	onboarding	foundation	\N	\N	\N	India	Vikram Reddy	CIO	\N	\N	\N	0.00	0.00	100	\N	{healthcare,compliance}	\N	{}	\N	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
09df561b-4e65-409c-9330-7a05d85cf193	Neha Krishnan	BankCo	neha@bankco.in	\N	\N	Banking	enterprise	active	foundation	\N	\N	\N	India	Neha Krishnan	Integration Architect	\N	\N	\N	1000000.00	0.00	88	\N	{banking,mulesoft}	\N	{}	\N	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
7357e9f9-b8d0-4856-ba66-9ffb04c31566	Rajesh Kumar	TechCorp India	rajesh@techcorp.in	\N	\N	Technology	enterprise	active	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	0.00	0.00	100	\N	{referral}	\N	{}	\N	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
0a1b74a2-77ba-4283-82ca-f6a8e93394f3	Priya Sharma	FinServ Solutions	priya@finserv.com	\N	\N	Financial Services	mid-market	active	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	0.00	0.00	100	\N	{linkedin}	\N	{}	\N	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
f7743140-ec60-47dd-b7b3-a6f63ee19ef4	Amit Patel	HealthPlus Systems	amit@healthplus.io	\N	\N	Healthcare	enterprise	onboarding	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	0.00	0.00	100	\N	{website}	\N	{}	\N	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
6bb10836-8f76-4e25-badd-73d02501c736	Sneha Gupta	RetailMax	sneha@retailmax.in	\N	\N	Retail	enterprise	active	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	0.00	0.00	100	\N	{conference}	\N	{}	\N	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
9bc95426-dd7d-4959-829c-41b873ce9ce0	Vikram Singh	EduTech Ventures	vikram@edutech.co	\N	\N	Education	mid-market	onboarding	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	0.00	0.00	100	\N	{linkedin}	\N	{}	\N	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
\.


--
-- Data for Name: company_values; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_values (id, name, description, icon, color, principles, examples, sort_order, is_active, metadata, created_at, updated_at) FROM stdin;
9700fd74-8355-4cc0-aa92-0b687e0e8532	Integration Excellence	We deliver world-class integration solutions that transform businesses	zap	blue	{"Quality over quantity","Best practices always","Continuous improvement"}	{"Code reviews on all deliverables","Following MuleSoft certified patterns","Regular architecture assessments"}	1	t	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
71f251d4-169a-4f21-96a2-79930130d5af	Customer Success	Our clients success is our success - we go beyond delivery to ensure outcomes	heart	green	{"Proactive communication","Outcome-focused delivery","Long-term partnerships"}	{"Monthly business reviews","Success metrics tracking","Dedicated advisory support"}	2	t	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
34d5189f-8c18-48a0-8bb2-efc0b1a7916a	Knowledge Sharing	We believe in democratizing integration knowledge through education and community	book-open	purple	{"Open knowledge sharing","Community building","Continuous learning"}	{"Free community resources","Integration Architects Community","Public thought leadership"}	3	t	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
e11becf8-d33b-4d30-8d9e-261035e08c89	Innovation	We leverage AI and modern technologies to solve complex integration challenges	lightbulb	amber	{"AI-first solutions","Modern architecture","Continuous experimentation"}	{"Template Forge AI","Normalize AI","AI-powered consulting"}	4	t	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
1eee87c7-50e0-4388-b686-caa378f51f63	Transparency	Clear communication, honest pricing, and open collaboration with all stakeholders	eye	cyan	{"Clear pricing","Open communication","No hidden agendas"}	{"Detailed proposals","Regular status updates","Honest capability assessments"}	5	t	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
\.


--
-- Data for Name: content_library; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_library (id, title, type, status, category, description, content, thumbnail_url, file_url, platform, scheduled_at, published_at, views, engagement, shares, tags, metadata, created_at, updated_at) FROM stdin;
07c73ede-db6b-4874-9073-f8d13f0333df	Why Your MuleSoft Implementation Fails: 5 Critical Mistakes	article	published	thought_leadership	Deep dive into common MuleSoft implementation pitfalls	\N	\N	\N	linkedin	\N	2024-12-15 00:00:00+00	12500	890	156	{mulesoft,best-practices}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
b1d602b3-5aab-46b1-91bc-fa4dd909a9db	Integration Architecture Patterns 2025	ebook	published	lead_magnet	Comprehensive guide to modern integration patterns	\N	\N	\N	website	\N	2024-11-01 00:00:00+00	3200	0	245	{integration,architecture,ebook}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
8ef96d33-360a-4b21-a145-f900f7c86f89	Customer Success Automation Playbook	guide	published	lead_magnet	Step-by-step guide to automating CS workflows	\N	\N	\N	website	\N	2024-08-15 00:00:00+00	1850	0	98	{customer-success,automation}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
6a1d9480-d56a-4f66-b5be-51f9c51d83cb	From Java Architect to Fractional CTO	video	published	case_study	My journey video - building IntegrateWise	\N	\N	\N	youtube	\N	2024-10-20 00:00:00+00	8500	620	180	{personal-brand,story}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
2047ca7f-8d6f-423e-99a7-960b88e8f3fe	MuleSoft vs Dell Boomi: 2025 Comparison	article	published	seo	Detailed comparison for enterprise integration platforms	\N	\N	\N	blog	\N	2024-12-01 00:00:00+00	15800	450	320	{mulesoft,comparison,seo}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
3182e7b7-a47d-435b-a3ab-0f7526a54635	Template Forge AI Demo	video	draft	product	Product demo video for Template Forge AI	\N	\N	\N	youtube	\N	\N	0	0	0	{product,demo,template-forge}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
0150b766-849f-407d-89e3-ffb986c14d18	Integration ROI Calculator	tool	published	lead_magnet	Interactive calculator showing integration ROI	\N	\N	\N	website	\N	2024-09-10 00:00:00+00	2100	0	45	{calculator,roi,lead-gen}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
77984b28-2f44-449d-bcd3-b8a208831626	Weekly Integration Insights Newsletter	newsletter	active	nurture	Weekly email with integration tips and news	\N	\N	\N	email	\N	2024-01-01 00:00:00+00	52000	18500	0	{newsletter,email}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
58f547c6-874d-4c26-ba91-1635f0a03abf	API Design Best Practices Checklist	checklist	published	lead_magnet	Downloadable checklist for API design	\N	\N	\N	website	\N	2024-07-20 00:00:00+00	4200	0	180	{api,checklist,lead-gen}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
9fb8cdbe-55af-4164-a05f-8cafe2f37b22	Founder Coaching Success Stories	case_study	published	social_proof	Collection of coaching client testimonials	\N	\N	\N	website	\N	2024-11-15 00:00:00+00	980	0	25	{coaching,testimonials}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
6f5223f8-22c4-463e-90ad-804c7b0be649	MuleSoft Certification Study Guide	guide	published	community	Free study guide for MuleSoft certification	\N	\N	\N	community	\N	2024-06-01 00:00:00+00	8900	0	520	{mulesoft,certification,free}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
44bc2517-9d9a-43f1-9cd0-ef2c77d1dcdc	Integration Excellence Workshop Deck	presentation	published	workshop	Slide deck for corporate training workshops	\N	\N	\N	internal	\N	2024-10-01 00:00:00+00	450	0	0	{workshop,training}	{}	2025-12-18 00:09:54.207414+00	2025-12-18 00:09:54.207414+00
\.


--
-- Data for Name: conversion_funnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversion_funnel (id, visitor_id, stage, previous_stage, page_id, form_id, lead_id, deal_id, client_id, source, campaign, revenue_attributed, converted_at, metadata, created_at) FROM stdin;
6680aa5d-4939-4380-bf00-170924523ecc	vis_001	customer	opportunity	\N	\N	\N	\N	\N	google	brand-search	750000.00	2025-11-19 22:51:51.657947+00	{}	2025-12-19 22:51:51.657947+00
e82fcd4d-839c-4f86-84d5-43bffa37ea52	vis_001	opportunity	sql	\N	\N	\N	\N	\N	google	brand-search	0.00	2025-11-04 22:51:51.657947+00	{}	2025-12-19 22:51:51.657947+00
9e8f2651-5b52-4ca6-8d8e-2a20c7a82ede	vis_001	sql	mql	\N	\N	\N	\N	\N	google	brand-search	0.00	2025-10-20 22:51:51.657947+00	{}	2025-12-19 22:51:51.657947+00
0a0e34f2-c505-41f9-8e2f-b341cd95a5c0	vis_002	sql	mql	\N	\N	\N	\N	\N	linkedin	cto-advisory	0.00	2025-12-12 22:51:51.657947+00	{}	2025-12-19 22:51:51.657947+00
99c5b97a-eee3-4360-aef0-c53fde6e2065	vis_002	mql	lead	\N	\N	\N	\N	\N	linkedin	cto-advisory	0.00	2025-12-05 22:51:51.657947+00	{}	2025-12-19 22:51:51.657947+00
df7d10c9-3955-4533-bbd6-e3a42d87c5cc	vis_003	mql	lead	\N	\N	\N	\N	\N	twitter	integration-webinar	0.00	2025-12-14 22:51:51.657947+00	{}	2025-12-19 22:51:51.657947+00
be2111cc-b0a7-49d5-a6e1-7e5e6dccafb5	vis_005	customer	opportunity	\N	\N	\N	\N	\N	referral	\N	1200000.00	2025-12-04 22:51:51.657947+00	{}	2025-12-19 22:51:51.657947+00
\.


--
-- Data for Name: daily_insights; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_insights (id, insight_date, summary, key_actions, metrics_snapshot, brainstorm_count, tasks_created, content_generated, pipeline_updates, metadata, created_at) FROM stdin;
c51fc251-0501-4298-b245-def85b414d0b	2025-12-18	Strong momentum on Template Forge AI launch preparation. 3 brainstorming sessions completed with 8 actionable insights generated. Key priority: Complete landing page and demo video by Jan 15. Sales pipeline improvement framework in progress.	{"Complete Template Forge AI landing page (Priority: High)","Record product demo video showing 10x speed improvement","Publish CS Automation Playbook as lead magnet","Implement lead scoring matrix in CRM","Schedule LinkedIn launch campaign"}	{"mrr": 600000, "active_leads": 28, "pipeline_value": 4500000, "active_projects": 3}	3	8	5	0	{}	2025-12-18 03:48:32.461989+00
2b0f164b-83fd-4644-8c99-d00d7ba75ad5	2025-12-20	Today's data for IntegrateWise OS indicates a stagnation in activity, with no brainstorming sessions, AI-generated insights, or pipeline updates recorded. This lack of progress highlights the immediate need for strategic engagement and revitalization of activities within the team.	{"**Initiate Team Check-in**: Schedule a meeting to identify barriers to activity and reengage team members in current projects.","**Set Immediate Goals**: Establish clear, short-term objectives to stimulate brainstorming and content generation.","**Enhance AI Utilization**: Review and promote the use of AI tools to drive insights and pipeline updates among team members.","**Incentivize Participation**: Consider launching a motivational campaign to encourage team involvement in brainstorming sessions and content creation."}	{}	0	0	0	0	{}	2025-12-20 09:00:55.45383+00
ffac3c2f-720f-4cc0-8ec6-0b26a0c7723e	2025-12-21	Today's data for IntegrateWise OS indicates a stagnant performance with no brainstorming sessions or AI-generated insights recorded. This significant lack of activity suggests an urgent need to re-engage teams and leverage AI capabilities to enhance productivity and pipeline management.	{"**Initiate Team Engagement:** Schedule a meeting to address the lack of brainstorming sessions and stimulate creative collaboration among team members.","**Audit AI Utilization:** Review the current use of AI tools to identify barriers preventing insights and task generation.","**Set Daily Metrics Tracking:** Implement a daily check-in process to monitor key performance indicators and ensure timely updates on activities.","**Encourage Content Creation:** Motivate team members to generate content by introducing incentives or workshops on effective content strategies.","**Identify Pipeline Gaps:** Conduct a thorough review of the sales pipeline to determine areas needing updates or attention, promoting proactive engagement."}	{}	0	0	0	0	{}	2025-12-21 09:00:55.436738+00
f7869483-b38d-4384-aff0-fc323551cdfa	2025-12-22	Today saw no activity in brainstorming sessions or AI-generated insights for IntegrateWise OS, indicating a potential slowdown in engagement and productivity. It is essential to address this gap to maintain momentum and drive results moving forward.	{"**Schedule Brainstorming Sessions**: Organize and facilitate brainstorming sessions to re-engage teams and encourage collaboration on new ideas and initiatives.","**Implement AI Utilization Training**: Offer training on leveraging AI capabilities to enhance task creation and pipeline updates, ensuring teams are equipped to maximize tools at their disposal.","**Conduct a Performance Review**: Analyze current workflows and identify any bottlenecks contributing to today's inactivity, adjusting processes as necessary to boost output.","**Set Daily Performance Metrics**: Establish and monitor key performance indicators daily to track engagement and productivity proactively.","**Encourage Team Check-Ins**: Foster an open communication environment by scheduling brief daily check-ins to discuss current projects and identify support needed."}	{}	0	0	0	0	{}	2025-12-22 09:00:55.765224+00
5adb1be6-a91d-4ba6-bbe2-8859895e959e	2025-12-23	Today saw minimal activity within IntegrateWise OS, with no brainstorming sessions, AI-generated insights, or tasks created. This stagnation suggests a need for renewed focus on strategy and engagement to drive productivity and innovation.	{"**Initiate Brainstorming Sessions**: Schedule and facilitate brainstorming sessions to stimulate team collaboration and generate new ideas.","**Review AI Capabilities**: Assess and enhance the utilization of AI tools to ensure effective task and content generation.","**Engage Teams**: Conduct outreach to teams to identify challenges and drive motivation towards completing pending tasks.","**Pipeline Review Meeting**: Organize a meeting to review the current pipeline and strategize on updates for better progress tracking.","**Feedback Loop Implementation**: Establish a feedback mechanism to gather team input on processes and identify areas for improvement."}	{}	0	0	0	0	{}	2025-12-23 09:00:53.922308+00
9e1afc0f-d064-480c-a64b-c73a7519e401	2025-12-24	Today’s business intelligence metrics indicate a lack of activity within IntegrateWise OS, with no brainstorming sessions, AI-generated insights, or tasks created. This stagnation highlights an urgent need for revitalization to drive engagement and innovation.	{"Initiate brainstorming sessions to encourage idea generation and participation among team members.","Assess potential barriers to AI-generated insights and implement strategies to enhance their utilization.","Review current project pipelines to identify areas needing updates or follow-ups to maintain momentum.","Schedule a team meeting to address engagement strategies and encourage collaborative efforts.","Develop a clear communication plan to boost awareness of available tools and their benefits for the team."}	{}	0	0	0	0	{}	2025-12-24 09:00:14.636363+00
90c74288-7418-44d8-a566-4cbbadbb97fe	2025-12-25	Today's data indicates a complete standstill in activity for IntegrateWise OS, with no brainstorming sessions, AI-generated insights, or task updates recorded. This lack of engagement highlights an urgent need to reassess our strategies for driving productivity and innovation.	{"**Reevaluate Team Engagement**: Organize a meeting to discuss barriers to participation and brainstorm new ideas to encourage collaboration.","**Set Up AI Utilization Review**: Analyze potential areas where AI can add value and promote its integration into daily operations.","**Implement Daily Check-ins**: Introduce brief daily stand-up meetings to track task progress and maintain team motivation.","**Develop Content Creation Strategy**: Propose a workshop to inspire content generation and knowledge sharing among team members.","**Revise Performance Metrics**: Update current metrics to better reflect engagement and productivity in real-time."}	{}	0	0	0	0	{}	2025-12-25 09:00:15.260861+00
8df2f8fd-4ce7-43be-8bcf-e842058d27e8	2025-12-26	Today saw no activity in brainstorming sessions or AI-generated insights, resulting in a stagnant pipeline and no new tasks or content. This lack of engagement highlights a need for renewed focus on driving collaboration and leveraging AI tools to enhance productivity. 	{"**Initiate a Team Meeting**: Schedule a session to identify barriers to engagement and foster brainstorming among team members.","**Review AI Tools Usage**: Analyze current usage of AI capabilities to identify opportunities for improvement and training.","**Set Daily/Weekly Goals**: Establish clear objectives for brainstorming and AI engagement to ensure consistent activity moving forward.","**Conduct Feedback Surveys**: Gather insights from the team about potential roadblocks and areas for improvement in the use of IntegrateWise OS.","**Implement Accountability Measures**: Assign ownership for key projects to ensure all team members are actively contributing to the pipeline."}	{}	0	0	0	0	{}	2025-12-26 09:00:16.916374+00
24ff0f60-3010-4596-aba0-0c5581fc825f	2025-12-27	Today, IntegrateWise OS recorded no activity in brainstorming sessions or AI-generated insights, leading to a stagnant day in task creation, content generation, and pipeline updates. This lack of engagement signals a critical need to reassess our current strategies and foster a more proactive environment for innovation.	{"**Initiate Brainstorming Sessions**: Schedule at least two brainstorming sessions within the next week to encourage idea generation and team collaboration.","**Reinforce AI Utilization**: Provide targeted training on how to leverage AI tools effectively for task creation and content generation to enhance productivity.","**Review Engagement Metrics**: Analyze team engagement levels and identify barriers to participation, implementing necessary changes to drive involvement.","**Set Clear Objectives**: Define specific, measurable goals for the upcoming quarter to ensure alignment and accountability across teams.","**Regular Check-ins**: Establish routine check-ins to track progress on initiatives and encourage ongoing communication among team members."}	{}	0	0	0	0	{}	2025-12-27 09:00:16.616868+00
de492159-ed25-418c-ab25-ea49bb4b65a4	2025-12-28	Today, IntegrateWise OS recorded no brainstorming sessions or AI-generated insights, resulting in zero tasks created, content generated, and pipeline updates. This stagnation may hinder progress and strategic initiatives, requiring immediate attention to reinvigorate productivity.	{"**Schedule Team Brainstorming Sessions**: Initiate brainstorming meetings to generate ideas and foster collaboration among team members.","**Review AI Utilization**: Evaluate current AI tools and strategies to identify barriers preventing insights and updates; consider training sessions for effective usage.","**Set Daily Metrics Goals**: Establish clear daily targets for brainstorming, insights, and tasks to track progress and ensure accountability.","**Boost Team Engagement**: Implement team-building activities to enhance motivation and creativity within the team.","**Monitor Progress Regularly**: Create a schedule for daily or weekly progress reviews to prevent stagnation and promote a results-oriented culture."}	{}	0	0	0	0	{}	2025-12-28 09:00:15.340787+00
7c38ec60-7daa-46bb-afe2-f989279e9e1d	2025-12-29	Today's data for IntegrateWise OS indicates a complete lack of activity across key performance metrics, with no brainstorming sessions, AI-generated insights, or task creations reported. This stagnant performance highlights an urgent need to engage team members and leverage our AI capabilities.	{"**Schedule Team Meetings**: Organize a brainstorming session to energize the team and foster collaboration.","**Review AI Utilization**: Assess the current usage of AI tools and identify barriers preventing task creation and insights generation.","**Set Daily Goals**: Establish daily performance targets to motivate team members and track engagement effectively.","**Launch a Feedback Initiative**: Gather input from team members on challenges faced and suggestions for improvement.","**Monitor Progress Closely**: Implement a daily check-in to ensure continuous engagement and accountability moving forward."}	{}	0	0	0	0	{}	2025-12-29 09:00:16.643132+00
0770cc8c-7078-4f82-ae72-5ce93377fbb4	2025-12-30	Today saw no activity in brainstorming sessions or AI-generated insights, indicating a lack of engagement and productivity. Immediate intervention is required to stimulate innovation and maintain momentum in ongoing projects.	{"**Initiate a Team Engagement Plan**: Schedule a brainstorming session to encourage idea generation and collaboration among team members.","**Set Daily/Weekly AI Utilization Goals**: Establish targets for AI-generated insights to keep projects progressing and capitalize on automation capabilities.","**Review Current Pipeline Status**: Assess the reasons behind zero updates and identify bottlenecks preventing progression.","**Conduct a Team Check-in**: Facilitate a discussion to identify obstacles the team is facing and propose solutions to enhance productivity."}	{}	0	0	0	0	{}	2025-12-30 09:00:15.027517+00
fa6f500a-9e9f-4788-945a-50d52c8e93e6	2025-12-31	Today reflected a quiet operational environment for IntegrateWise OS, with no brainstorming sessions or AI-generated insights recorded. Current metrics indicate a lack of activity in task creation, content generation, and pipeline updates, suggesting an immediate need to stimulate engagement and collaboration.	{"**Initiate Team Engagement**: Schedule a team meeting to discuss barriers to brainstorming and encourage participation.","**Review AI Tools**: Evaluate the current AI tool effectiveness and consider training or updates to stimulate insights and content generation.","**Reassess Pipeline Strategy**: Investigate the lack of pipeline updates to identify gaps and strategize on re-engaging stakeholders.","**Set Daily Accountability**: Implement a daily check-in process to track task creation and insights, fostering a more proactive team environment.","**Encourage Idea Submission**: Launch a quick feedback initiative to gather ideas and topics for discussion in upcoming sessions."}	{}	0	0	0	0	{}	2025-12-31 09:00:25.650188+00
0283dd15-94ca-4a76-9f8f-42cd8c42efd8	2026-01-01	Today’s business intelligence report for IntegrateWise OS indicates minimal activity, with no brainstorming sessions or AI-generated insights. This stagnation reflects a potential need for increased engagement and strategic initiatives to drive productivity.	{"**Initiate Brainstorming Sessions**: Schedule and promote brainstorming sessions to foster collaboration and idea generation among teams.","**Enhance AI Utilization**: Review and enhance tools or processes to encourage the generation of AI-driven insights and content.","**Conduct Team Engagement Surveys**: Assess team morale and engagement to identify barriers to productivity and innovation.","**Set Daily Activity Goals**: Establish clear daily metrics and goals to track progress and ensure active participation across teams.","**Review Current Processes**: Evaluate existing workflows for inefficiencies and explore opportunities for automation or improvement."}	{}	0	0	0	0	{}	2026-01-01 09:00:24.904462+00
868ff321-864a-4351-ae88-073aaa99b2ad	2026-01-02	Today, IntegrateWise OS reported no activity in brainstorming sessions or AI-generated insights, highlighting a significant lull in productivity. Immediate focus on engagement initiatives is essential to revitalize team collaboration and data-driven outputs.	{"Schedule team brainstorming sessions to foster creative engagement and idea generation.","Encourage the use of AI tools by providing training or incentives, aiming for at least 3 AI-generated outputs daily.","Analyze existing workflows for bottlenecks that may be affecting task and pipeline updates, implementing quick fixes where needed.","Set up a team meeting to discuss ongoing barriers to productivity and collective strategies for improvement."}	{}	0	0	0	0	{}	2026-01-02 09:00:24.125603+00
92a51b76-398f-46ad-9e7c-00b6e7b889b2	2026-01-03	Today, IntegrateWise OS experienced no activity in brainstorming sessions, AI-generated insights, and task creation, indicating a potential stagnation in collaboration and productivity. Immediate intervention is necessary to boost engagement and output across teams.	{"**Schedule a Team Engagement Meeting**: Facilitate a brainstorming session to re-energize team collaboration and idea generation.","**Review and Optimize AI Utilization**: Evaluate current usage of AI tools to identify barriers preventing insights and content generation.","**Set Clear Daily Targets**: Implement a daily goal-setting practice to encourage task creation and pipeline updates.","**Encourage Interdepartmental Collaboration**: Initiate cross-functional partnerships to stimulate innovation and share resources effectively."}	{}	0	0	0	0	{}	2026-01-03 09:00:24.130665+00
c5ece4ab-1bcb-49a7-b7cf-4087ea436544	2026-01-04	Today’s data indicates a lack of engagement across key activities, with no brainstorming sessions, AI-generated insights, or task initiation. This underscores the need for renewed focus on productivity and innovation within IntegrateWise OS to drive actionable insights and project momentum.	{"**Reinstate Daily Brainstorming Sessions**: Schedule and encourage participation to foster collaboration and generate innovative ideas.","**Engage Teams on AI Utilization**: Conduct a workshop to demonstrate the potential of AI tools and encourage their proactive use for insights and content generation.","**Analyze Current Workflows**: Review existing processes to identify bottlenecks preventing task creation and pipeline updates.","**Set Clear KPIs for Today’s Performance**: Establish measurable objectives for team activities to track engagement and output moving forward."}	{}	0	0	0	0	{}	2026-01-04 09:00:29.376641+00
594cdcdb-9895-4993-908c-eb3a26829f95	2026-01-05	Today saw no activity in brainstorming sessions or AI-generated insights, indicating a potential bottleneck in innovation and data utilization within IntegrateWise OS. The absence of new tasks, content, or pipeline updates highlights an urgent need to address engagement and operational output.	{"**Facilitate Brainstorming Sessions**: Schedule targeted brainstorming meetings to stimulate idea generation and collaboration among team members.","**Implement AI Tools**: Encourage the use of AI-driven insights by training staff on tools available, focusing on their applicability to daily tasks.","**Review Pipeline Status**: Conduct a thorough review of the current pipeline to identify areas requiring attention and ensure actionable updates are made.","**Enhance Engagement Initiatives**: Design initiatives to boost team engagement and creativity to foster a more proactive work environment.","**Daily Metrics Monitoring**: Establish a routine for monitoring daily metrics to quickly identify trends and address them promptly."}	{}	0	0	0	0	{}	2026-01-05 09:00:27.44529+00
27fb0e17-6ade-4808-aefc-dd46e76d139c	2026-01-06	Today marked a period of stagnation for IntegrateWise OS, highlighted by zero brainstorming sessions and no AI-generated insights, tasks, or pipeline updates. This lack of activity indicates a need for immediate strategic initiatives to rejuvenate engagement and productivity levels within the team.	{"**Schedule a Team Motivational Meeting**: Identify barriers and encourage innovative brainstorming to reignite creativity and collaboration among team members.","**Assess AI Utilization**: Review current AI tools to understand underutilization and explore enhancements or training that could drive insights and task creation.","**Implement Daily Check-Ins**: Establish brief daily meetings to track progress and address any operational roadblocks promptly.","**Revise Project Priorities**: Evaluate ongoing projects to determine if adjustments are needed for better alignment with team capabilities and market demands.","**Engage with Stakeholders**: Reach out to key stakeholders for feedback on project statuses and potential improvements to the overall workflow."}	{}	0	0	0	0	{}	2026-01-06 09:00:25.540806+00
8d49a8fa-47d4-47c1-89c6-e632803ac992	2026-01-07	Today’s metrics indicate a lack of engagement in brainstorming sessions and AI-generated insights, with no tasks or content created. This stagnation could hinder progress on key projects and overall operational efficiency.	{"**Encourage Team Engagement:** Implement a structured schedule for brainstorming sessions to foster collaboration and innovation.","**Boost Utilization of AI Tools:** Provide training sessions on how to effectively leverage AI-generated insights to enhance productivity.","**Review Project Pipeline:** Conduct a meeting to assess current projects and ensure timely updates and task assignments are made.","**Set Measurable Goals:** Establish clear KPIs for daily productivity to monitor and drive engagement moving forward."}	{}	0	0	0	0	{}	2026-01-07 09:00:25.308182+00
5b4aaf3c-758f-4d5f-8098-05a3600e2d49	2026-01-08	Today's data shows a complete halt in activity across all key performance indicators in IntegrateWise OS, with no brainstorming sessions, AI-generated insights, or any tasks and content created. This lack of engagement indicates a pressing need to assess and reinvigorate team workflows and productivity channels.	{"**Conduct a Team Engagement Review**: Schedule a meeting to discuss barriers to participation and generate ideas to enhance collaboration.","**Reassess Workflow Processes**: Analyze current productivity practices and identify any inefficiencies that may be hindering output.","**Implement Incentives for Contributions**: Introduce initiatives or rewards to motivate team members to actively participate in brainstorming and insights generation.","**Set Daily Check-ins**: Establish short daily touchpoints to encourage updates and maintain momentum among team members.","**Evaluate AI Tool Usage**: Review the current AI tools' effectiveness and explore training sessions to enhance utilization."}	{}	0	0	0	0	{}	2026-01-08 09:00:25.822173+00
0ba8950e-bf44-4caa-ab24-2de8baecca52	2026-01-09	Today, IntegrateWise OS did not conduct any brainstorming sessions or generate AI-driven insights, resulting in no new tasks, content, or pipeline updates. This stagnant data indicates a need for renewed focus on collaboration and innovation.	{"**Schedule Brainstorming Sessions**: Initiate at least two brainstorming sessions this week to foster idea generation and collaboration among teams.","**Review AI Utilization**: Evaluate the current AI tools and processes to identify barriers preventing effective insights and engagement.","**Encourage Team Contributions**: Implement a system for team members to propose topics or projects, motivating participation and innovation.","**Analyze Previous Performance**: Conduct a retrospective analysis of past productive sessions and insights to identify successful strategies and areas for improvement."}	{}	0	0	0	0	{}	2026-01-09 09:00:25.868651+00
9ab117d3-5ad5-4e12-a179-37ca96159461	2026-01-10	Today’s business intelligence data for IntegrateWise OS indicates a lack of engagement, with no brainstorming sessions, AI-generated insights, or task management activities recorded. This gap highlights a need for immediate action to drive productivity and innovation.	{"**Facilitate Team Engagement:** Schedule a brainstorming session for tomorrow to stimulate idea generation and collaboration.","**Review AI Utilization:** Assess the current use of AI tools and identify barriers preventing effective insights and task creation.","**Implement Feedback Mechanism:** Introduce a quick survey for team members to gauge interest in future AI-led initiatives and support needs.","**Analyze Workflow Efficiency:** Evaluate existing workflows to identify inefficiencies that may be contributing to the lack of activity.","**Set Clear Targets:** Establish measurable goals for team collaboration and task completion for the upcoming week to drive accountability."}	{}	0	0	0	0	{}	2026-01-10 09:00:25.949903+00
792f7ebc-de63-4c82-b4a1-2c5f746c9c0b	2026-01-11	Today's data for IntegrateWise OS reflects a complete idle period in terms of brainstorming sessions and AI-generated insights, indicating a potential stagnation in activity and productivity. Immediate intervention is required to reinvigorate engagement and capitalize on momentum.	{"**Initiate Team Engagement:** Organize a mandatory brainstorming session to stimulate idea generation and collaboration among team members.","**Evaluate AI Tools:** Assess the effectiveness and user engagement with the current AI features to identify barriers to usage or improvement areas.","**Set Daily Targets:** Establish daily or weekly goals for AI-generated tasks and insights to create accountability and measure progress.","**Encourage Feedback:** Implement a feedback loop to gather insights from users on features they find lacking or suggestions for improvement.","**Monitor Activity Levels:** Introduce regular check-ins to track team activities and engagement levels to ensure sustained productivity."}	{}	0	0	0	0	{}	2026-01-11 09:00:41.859323+00
76fdce81-440e-4e66-b270-ca8074f52b9e	2026-01-12	Today’s business intelligence data shows no activity in brainstorming sessions or AI-generated insights for IntegrateWise OS. This lack of engagement indicates a potential stagnation in innovation and productivity, necessitating immediate intervention to stimulate activity and drive progress.	{"**Facilitate Brainstorming Sessions:** Schedule and promote team brainstorming sessions to encourage idea generation and collaboration.","**Engage Stakeholders:** Actively reach out to teams and individuals to identify barriers to participation and gather feedback.","**Monitor Pipeline Activity:** Review and analyze current project pipelines to pinpoint areas needing urgent attention or support.","**Implement AI Tools Training:** Organize training sessions to familiarize staff with AI tools and encourage usage for content generation and task management.","**Set Daily Check-ins:** Establish a routine of daily check-ins to track engagement and encourage contributions across teams."}	{}	0	0	0	0	{}	2026-01-12 09:00:43.568123+00
16540f60-3a95-46b7-8ed8-7daf7c49a722	2026-01-13	Today, IntegrateWise OS saw no engagement in brainstorming sessions or AI-generated insights, indicating a potential stagnation in collaboration and innovation efforts. The absence of generated tasks, content, and pipeline updates reflects a need for proactive measures to stimulate productivity and drive project momentum.	{"**Re-engage Team Members:** Schedule a team meeting to discuss barriers to collaboration and encourage participation in upcoming brainstorming sessions.","**Initiate AI Usage Campaign:** Launch a campaign highlighting the benefits and ease of using AI tools to generate insights, tasks, and content.","**Implement Daily Check-ins:** Establish brief daily check-ins to monitor project progress and encourage contributions from team members.","**Review Workflow Processes:** Analyze current workflows to identify bottlenecks and implement solutions that facilitate task creation and updates.","**Set Performance Goals:** Define clear performance targets for task completion and content generation to motivate the team and track progress."}	{}	0	0	0	0	{}	2026-01-13 09:00:41.372846+00
bca3ec04-d4f4-4eed-a07b-435ef3126cb9	2026-01-14	Today, IntegrateWise OS experienced no activity in brainstorming sessions or AI-generated insights, indicating a potential slowdown in innovation and operational momentum. Without any new tasks, content, or pipeline updates, it is critical to identify and address barriers to engagement and productivity.	{"**Conduct Team Check-Ins**: Schedule meetings with team leads to assess obstacles hindering brainstorming and AI implementation.","**Reevaluate Project Priorities**: Review current projects and redirect focus to stimulate proactive engagement and idea generation.","**Implement Daily Stand-Ups**: Introduce brief daily stand-up meetings to encourage ongoing collaboration and accountability among teams.","**Incentivize Contributions**: Develop incentives for team members to contribute ideas and insights actively to ignite creativity and participation."}	{}	0	0	0	0	{}	2026-01-14 09:00:18.494554+00
d9a736bc-d12a-4e17-9b98-1fd8e5b9d96a	2026-01-15	Today’s data reflects a complete halt in activity across multiple areas of IntegrateWise OS, including no brainstorming sessions or AI-generated insights. This lack of engagement requires immediate intervention to stimulate team collaboration and drive productivity.	{"**Facilitate Team Engagement**: Schedule a team meeting to encourage brainstorming and idea generation.","**Analyze Barriers**: Identify any obstacles hindering activity and address them promptly.","**Reinforce AI Utilization**: Provide training on leveraging AI tools for task creation and content generation to enhance efficiency.","**Set Daily Goals**: Implement a daily check-in to establish clear objectives and accountability for team members.","**Monitor Progress**: Introduce metrics to monitor engagement and output regularly, ensuring timely follow-up on progress."}	{}	0	0	0	0	{}	2026-01-15 09:00:35.003595+00
17954f79-8fe9-4f1c-a6e5-a7636f2fa836	2026-01-16	Today, IntegrateWise OS experienced no activity in brainstorming sessions, AI-generated insights, or updates across key operational metrics. This lack of engagement highlights a critical stagnation that requires immediate attention to invigorate productivity and innovation.	{"**Initiate Team Engagement:** Schedule an immediate brainstorming session to foster collaboration and generate new ideas.","**Review AI Utilization:** Analyze current AI tools and workflows to identify barriers preventing insight generation and task creation.","**Pipeline Monitoring:** Conduct a thorough review of the sales pipeline to address potential stagnation and motivate updates or action.","**Feedback Collection:** Gather feedback from team members on factors limiting participation and creativity.","**Set Daily Goals:** Implement a daily goal-setting process to ensure measurable activity and accountability moving forward."}	{}	0	0	0	0	{}	2026-01-16 09:00:32.446891+00
431d84bc-cafc-4617-aa44-74cd39c75420	2026-01-17	Today saw no activity in brainstorming sessions or AI-generated insights for IntegrateWise OS, indicating a potential stagnation in innovation and task progression. With zero tasks created or updates to the pipeline, it is critical to identify and address barriers to productivity.	{"**Conduct a Team Check-in:** Schedule an immediate meeting to understand barriers to creativity and engagement that led to the absence of brainstorming and insights today.","**Reassess Project Priorities:** Review current priorities and allocate resources to spark new initiatives and encourage task creation.","**Encourage Participation in AI Insights:** Implement a campaign to promote the use of AI tools for generating insights and streamlining workflows among team members.","**Analyze Historical Data:** Evaluate trends in past activity to identify patterns that could inform strategies to boost engagement and output moving forward."}	{}	0	0	0	0	{}	2026-01-17 09:00:32.522225+00
f1716aa3-0bef-4665-b3c3-e76a207c726c	2026-01-18	Today, IntegrateWise OS experienced a lack of activity with no brainstorming sessions or AI-generated insights reported. This stagnation may hinder ongoing projects and decision-making processes, necessitating immediate intervention to re-engage teams and stimulate productivity.	{"**Initiate Team Check-ins**: Schedule immediate check-ins with teams to identify roadblocks and encourage collaborative brainstorming.","**Reassess AI Capabilities**: Evaluate the AI tools to ensure they are functioning optimally; consider a training session to enhance user engagement.","**Set Daily Goals**: Implement a system for setting daily objectives to foster accountability and track progress more effectively.","**Encourage Content and Idea Submissions**: Launch a quick survey or feedback loop to prompt team members to share ideas and content needs.","**Review Current Metrics**: Analyze metrics from previous days to identify trends and inform strategies for improved performance."}	{}	0	0	0	0	{}	2026-01-18 09:00:34.638863+00
e79d98c2-94a2-4926-8c23-f79c474f43ce	2026-01-19	Today’s activity for IntegrateWise OS has been notably absent, with no brainstorming sessions or AI-generated insights recorded. This stagnation highlights a critical need for revitalization in engagement and productivity.	{"**Initiate Team Engagement:** Schedule a brainstorming session to encourage idea generation and collaborative problem-solving.","**Assess AI Utilization:** Review current usage and integration of AI tools; consider staff training to enhance productivity.","**Set Daily Metrics Goals:** Establish clear, actionable objectives for daily tasks to drive focus and accountability.","**Implement Regular Check-ins:** Create a system for daily or weekly updates on project progress to maintain momentum.","**Encourage Content Generation:** Motivate teams to produce insights and updates regularly to foster a culture of continuous improvement."}	{}	0	0	0	0	{}	2026-01-19 09:00:33.184137+00
70babf9b-e3ef-4eb4-8fab-e52c0d671484	2026-01-20	Today's data indicates a complete standstill in brainstorming sessions and AI-generated insights, highlighting an urgent need to drive engagement and productivity within the team. Without any tasks created or content generated, it is critical to identify barriers and renew focus on our strategic goals.	{"**Conduct a Team Check-in**: Schedule a meeting to discuss obstacles preventing engagement and gather input on necessary resources or support.","**Set Daily Targets**: Establish clear daily targets for brainstorming sessions and AI-generated outputs to encourage proactive participation.","**Enhance AI Tools Training**: Offer training sessions on AI tools to boost team confidence and utilization of available resources.","**Monitor Collaboration Platforms**: Analyze usage data to identify low activity areas, and promote best practices for collaboration.","**Reassess Project Priorities**: Review current projects to realign team efforts with immediate business objectives, ensuring resources are directed effectively."}	{}	0	0	0	0	{}	2026-01-20 09:00:34.82995+00
44452dd3-be85-4772-8e8e-7cc27617de05	2026-01-21	Today's business intelligence data indicate a lack of activity within IntegrateWise OS, with no brainstorming sessions or AI-generated insights recorded. This stagnation suggests a need for immediate intervention to revitalize engagement and productivity.	{"**Schedule a Team Meeting**: Organize a session to assess barriers to brainstorming and foster idea generation.","**Review AI Utilization**: Evaluate the current use of AI tools to identify areas for improvement in task and content generation.","**Enhance Engagement Strategies**: Develop initiatives to boost team participation and collaboration, ensuring regular input into pipeline updates.","**Set Daily Activity Goals**: Establish clear daily goals for team activities to drive accountability and performance.","**Monitor Progress**: Implement a tracking system to monitor engagement levels and AI utilization in real-time."}	{}	0	0	0	0	{}	2026-01-21 09:00:34.098565+00
c1079cce-c201-4bbe-9c57-4928feb8864e	2026-01-22	Today's data shows a lack of engagement with integrations and AI-generated insights within IntegrateWise OS, as no brainstorming sessions, tasks, or content were produced. This stagnation indicates a need for immediate strategic action to stimulate productivity and ensure continuity in operations.	{"**Schedule Brainstorming Sessions:** Organize targeted sessions to generate new ideas and enhance team collaboration.","**Facilitate Training on AI Tools:** Provide training sessions to improve familiarity with AI capabilities and encourage their integration into daily workflows.","**Review and Adjust Pipeline Processes:** Analyze current pipeline metrics and identify bottlenecks or areas for improvement.","**Encourage Engagement with Platform Features:** Implement initiatives to promote active use of features within IntegrateWise OS to drive user interaction and productivity.","**Set Daily/Weekly Goals:** Establish a system for setting and tracking short-term goals to enhance accountability and focus."}	{}	0	0	0	0	{}	2026-01-22 09:00:35.11555+00
98fd3c4a-5e8f-4ecb-aa33-0b418d29744f	2026-01-23	Today's business intelligence report indicates no activity in brainstorming sessions or AI-generated insights, highlighting a stagnation in task creation and content generation. This lack of engagement may impact overall productivity and innovation within IntegrateWise OS.	{"Initiate a brainstorming session to invigorate team collaboration and idea generation.","Review and re-engage processes for AI insights to enhance productivity and decision-making.","Schedule a team meeting to identify barriers to activity and foster momentum.","Implement a feedback loop to encourage ongoing contributions from team members."}	{}	0	0	0	0	{}	2026-01-23 09:00:33.198213+00
c055d52b-6bf3-48cf-b12a-8948ba065236	2026-01-24	Today’s business activity in IntegrateWise OS has been notably stagnant, with no brainstorming sessions or AI-generated insights reported. Immediate attention is required to stimulate engagement and drive productivity.	{"**Schedule Brainstorming Sessions**: Organize at least one team brainstorming session to encourage idea generation and collaboration.","**Implement AI Training Sessions**: Host a workshop to demonstrate the capabilities of AI tools and encourage their use in daily tasks.","**Review Current Engagement Strategies**: Analyze current user engagement practices and identify barriers to participation and contribution.","**Set Daily Check-Ins**: Establish a routine for daily check-ins to monitor activity levels and encourage proactivity among team members.","**Encourage Content Creation**: Initiate a campaign to motivate team members to leverage AI for content generation and task creation, possibly through incentives."}	{}	0	0	0	0	{}	2026-01-24 09:00:36.10631+00
007d202c-8b48-45f0-9eed-f6e645b3f41b	2026-01-25	Today, IntegrateWise OS experienced no activity in brainstorming sessions or AI-generated insights, indicating a significant stall in innovation and operational progress. With zero tasks created and no pipeline updates, immediate action is needed to reinvigorate momentum and drive productivity.	{"**Initiate Team Collaboration**: Schedule a mandatory brainstorming session to encourage idea generation and address stagnation.","**Review AI Utilization**: Analyze the current usage of AI tools to identify barriers to task creation and content generation.","**Update Pipeline Management**: Reassess the sales and project pipelines to ensure that opportunities are being actively pursued.","**Conduct a Team Retrospective**: Hold a meeting to discuss productivity challenges and brainstorm solutions for improvement.","**Set Daily Metrics Objectives**: Establish clear daily goals for brainstorming outputs and AI-generated insights to enhance accountability."}	{}	0	0	0	0	{}	2026-01-25 09:00:33.471911+00
9bed72c0-7eb6-4c0a-8ebf-d03f808e9214	2026-01-26	Today, IntegrateWise OS saw no activity in brainstorming sessions or AI-generated insights, resulting in zero tasks, content, and pipeline updates. This lack of engagement may hinder progress and innovation within the organization.	{"**Revitalize Engagement**: Initiate a call for brainstorming sessions to encourage collaboration and idea generation among team members.","**Analyze Bottlenecks**: Investigate the reasons behind the absence of AI-generated insights and address any technical or resource limitations.","**Set Daily Goals**: Establish clear daily objectives to drive productivity and ensure accountability across teams.","**Encourage Utilization of Tools**: Promote the use of AI features among employees to maximize the platform's potential.","**Organize a Feedback Session**: Schedule a meeting to gather input on current workflows and identify barriers to participation."}	{}	0	0	0	0	{}	2026-01-26 09:00:33.443639+00
a6c4f4f9-db8e-4e4c-b1c6-31e91f533e19	2026-01-27	Today's data shows a complete lack of activity in brainstorming sessions and AI-generated insights, indicating potential stagnation in innovation and operational progress. This lack of engagement could impact strategic decision-making and future planning.	{"**Reinitiate Brainstorming Sessions**: Schedule and promote brainstorming sessions to encourage idea generation and collaboration among team members.","**Enhance AI Utilization**: Identify reasons for the lack of AI-generated insights and implement strategies to better integrate AI tools into daily operations.","**Review Engagement Metrics**: Analyze team engagement levels and productivity to uncover barriers to participation and innovation.","**Establish Accountability**: Assign specific team members to drive content creation and task generation to stimulate activity and exploration.","**Conduct a Feedback Loop**: Gather feedback from the team on current processes to refine strategies and enhance overall performance."}	{}	0	0	0	0	{}	2026-01-27 09:00:34.385256+00
04ebe2f5-66a6-454a-ac28-80d344a10c8c	2026-01-28	Today, IntegrateWise OS experienced no activity in brainstorming sessions or AI-generated insights, highlighting a potential stagnation in innovative efforts and content creation. Immediate attention is required to reinvigorate collaboration and strategic planning to drive performance.	{"Schedule a team meeting to discuss barriers to brainstorming and foster a collaborative environment.","Launch a campaign to encourage team engagement and idea submissions for upcoming projects.","Review and assess the effectiveness of current AI tools, making necessary enhancements to stimulate insight generation.","Set clear goals for content creation and pipeline updates to re-align team priorities."}	{}	0	0	0	0	{}	2026-01-28 09:00:33.116746+00
\.


--
-- Data for Name: data_source_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.data_source_sync (id, source, sync_type, status, records_fetched, records_created, records_updated, records_failed, started_at, completed_at, error_message, error_details, metadata) FROM stdin;
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deals (id, name, lead_id, product_id, stage, value, currency, probability, expected_close_date, actual_close_date, assigned_to, source, notes, hubspot_deal_id, pipedrive_deal_id, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: deployments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deployments (id, project_id, environment, version, status, deployed_by, deployed_at, commit_sha, commit_message, build_time_seconds, url, logs, rollback_version, metadata, created_at) FROM stdin;
bd0a4abf-a7f1-491b-b45a-d8cf38139c43	f1daeeba-91f5-41b7-8b7e-8a7f42a629bc	staging	v0.3.0	success	Nirmal Prince	2024-12-15 11:00:00+00	abc123def	feat: Add rate limiting to API gateway	145	https://api-staging.techcorp.in	\N	\N	{}	2025-12-18 00:18:40.390582+00
80dad832-0e10-4cd3-9ec9-1d0ee84f25a6	f1daeeba-91f5-41b7-8b7e-8a7f42a629bc	staging	v0.2.0	success	Nirmal Prince	2024-12-10 08:30:00+00	def456ghi	feat: Implement OAuth2 authentication	132	https://api-staging.techcorp.in	\N	\N	{}	2025-12-18 00:18:40.390582+00
9842d1e7-4753-49ef-959f-0e92e3e1b9ec	486546e5-3b23-4aa4-a6d7-ae497ade8b55	staging	v0.1.0	success	Nirmal Prince	2024-12-14 05:30:00+00	ghi789jkl	initial: Setup n8n workflows for onboarding	98	https://cs-staging.insurepro.com	\N	\N	{}	2025-12-18 00:18:40.390582+00
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, title, content, category, description, icon, embedding, is_starred, view_count, metadata, created_at, updated_at) FROM stdin;
b60a8dcf-4a84-4bde-a5f5-bef7aa6fb3de	Business Strategy Plan	Long-term goals & initiatives. Email reporting guidelines. Comprehensive business strategy for IntegrateWise covering market positioning, growth targets, and competitive advantages.	strategy	Long-term goals & initiatives for IntegrateWise	Target	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
4e830f1f-6c7a-40e3-b35b-5073917c2600	Service Offerings	List of all services provided. Bundles and pricing. Integration consulting, implementation services, managed services, and custom development.	strategy	Complete catalog of IntegrateWise services	Briefcase	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
36069aac-f6a8-4d0c-9ff2-c7408cc48327	Pricing Strategy	Pricing modes & discounts. Value proposition. Value-based pricing model with tiered packages for different business sizes.	strategy	Pricing models and value propositions	DollarSign	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
65a08f40-748e-4586-8627-2a4ee2113582	Sales Playbook	Step-by-step sales process. CRM usage guidelines. Discovery call scripts, objection handling, and closing techniques.	sales	Complete sales process documentation	BookOpen	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
c167148d-1304-4d9a-ad94-30522078996c	Case Studies	Success stories & client testimonials. Real-world examples of successful integrations and ROI achieved.	sales	Client success stories and testimonials	Star	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
5033e4f7-4f63-417a-b314-4f2e127d9ec7	Proposal Templates	Standard proposal formats. Customizable templates for different client segments and project sizes.	sales	Ready-to-use proposal templates	FileText	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
d22eecd5-f141-4330-92b2-0e549126c1b0	Marketing Plan	Sourcing, channels & budget allocation. LinkedIn content strategy, email campaigns, and webinar schedule.	marketing	Marketing strategy and budget	Megaphone	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
873a4bca-1e31-49a5-bbd6-e7682f7a8450	LinkedIn Mastery	Personal branding & outreach guide. Content calendar, engagement strategies, and thought leadership.	marketing	LinkedIn marketing playbook	Linkedin	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
78d1c53a-8ea3-4a4d-b160-2aa5849d4e7f	Website Content	Website structure & copy guidelines. Landing pages, blog posts, and SEO strategy.	marketing	Website content and structure	Globe	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
4118e94f-6a0f-484b-a911-7e3112e834f4	Operations Manual	Internal processes & procedures. Daily operations, escalation paths, and quality control.	operations	Standard operating procedures	Settings	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
dfcfa8e6-6511-4046-88e4-367e6d6819fa	Client Onboarding	New client setup process. Kickoff meeting agendas, documentation requirements, and timeline.	operations	Client onboarding workflow	UserPlus	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
ec1dafdb-97ff-456f-b02a-c68bdd108273	Delivery Playbooks	Project execution & client onboarding. Implementation methodologies and best practices.	delivery	Project delivery guidelines	CheckSquare	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
ff117e0f-7232-4320-9b71-de9b592d1646	Technical Architecture	System design and integration patterns. API specifications, data flows, and security protocols.	technology	Technical documentation	Code	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
c18c54ef-5c87-4dc2-a381-b73f476275c9	Financial Guide	Budgeting, expenses & revenue tracking. Financial projections, expense categories, and reporting.	finance	Financial management guidelines	PieChart	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
b6a715a4-cf87-4cbb-abb8-ad91ecc6a83a	Dashboard Guide	Metrics, reporting & data analysis. KPI definitions, dashboard usage, and reporting schedules.	finance	Analytics and reporting guide	BarChart2	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
0495e51d-fbcf-4bfa-8b5f-c1aaef8341b7	Employee Handbook	Company policies, benefits, and culture. Leave policies, code of conduct, and growth opportunities.	hr	HR policies and guidelines	Users	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
6d539250-63b9-4b92-b1ca-03e66b4c22f7	Hiring Playbook	Recruitment process and interview guides. Job descriptions, assessment criteria, and onboarding checklist.	hr	Recruitment and hiring guide	UserPlus	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
37716c39-141a-442b-9304-ab39787573f4	Product Roadmap	Feature pipeline and release schedule. Quarterly goals, feature prioritization, and customer feedback integration.	product	Product development roadmap	Map	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
84b3d187-fa94-465c-a7bc-a07d18bb4193	Feature Specifications	Detailed feature requirements and user stories. Acceptance criteria and technical requirements.	product	Product feature documentation	Clipboard	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
1ea7db53-b0c9-4178-871f-c06e1918d3b7	Security Policies	Data protection and compliance. GDPR compliance, data handling, and security protocols.	technology	Security and compliance documentation	Shield	\N	f	0	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
\.


--
-- Data for Name: drive_files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.drive_files (id, name, file_type, mime_type, size_bytes, parent_folder_id, file_url, thumbnail_url, is_starred, is_shared, shared_with, embedding, content_preview, metadata, created_at, updated_at) FROM stdin;
97945149-444e-43a6-913f-0571d03fb1e3	Q4 Revenue Forecast.xlsx	spreadsheet	\N	245000	\N	\N	\N	t	f	{}	\N	Revenue projections for Q4 2024 with monthly breakdowns	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
b36e13e7-532d-4b16-8c88-43e8015ba048	Client Presentation - TechCorp.pptx	presentation	\N	3500000	\N	\N	\N	t	f	{}	\N	Sales presentation for TechCorp engagement	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
a8405087-2ac1-4765-8e2d-a6cf5bf8a9bd	Integration Architecture Diagram.png	image	\N	890000	\N	\N	\N	f	f	{}	\N	System architecture diagram showing data flows	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
40f253ba-2f26-4466-8f4e-ada7ea90346e	Contract Template.docx	document	\N	125000	\N	\N	\N	f	f	{}	\N	Standard contract template for new clients	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
ca1b59d3-700f-443f-84cc-7fece30145b4	Project Alpha	folder	\N	0	\N	\N	\N	t	f	{}	\N	All documents related to Project Alpha	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
9a4870ee-c786-4c17-b498-4b476f2ee0e8	Financial Reports 2024	folder	\N	0	\N	\N	\N	f	f	{}	\N	Monthly and quarterly financial reports	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
b3ce351e-ada0-461e-9033-4fd0b43cca22	Marketing Assets	folder	\N	0	\N	\N	\N	f	f	{}	\N	Logos, images, and marketing collateral	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
7fbc4df8-22c5-45c3-abdf-df0b09806f97	Security Compliance Checklist.pdf	pdf	\N	456000	\N	\N	\N	t	f	{}	\N	Compliance requirements and checklist	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
\.


--
-- Data for Name: emails; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.emails (id, subject, sender_name, sender_email, preview, body, folder, is_read, is_starred, has_attachments, thread_id, embedding, metadata, received_at, created_at) FROM stdin;
c6293b7c-f2b2-41be-a677-660972974642	Re: Project Proposal Review	John Smith	john@techcorp.com	Thanks for sending over the proposal. We reviewed it with our team and...	Thanks for sending over the proposal. We reviewed it with our team and have a few questions about the implementation timeline. Can we schedule a call this week to discuss?	inbox	f	t	f	\N	\N	{}	2025-12-17 20:14:23.105225+00	2025-12-17 22:14:23.105225+00
b1e41272-727f-4aa9-a972-d1b7f3a3eaf2	Monthly Newsletter - December	IntegrateWise	newsletter@integratewise.ai	Your monthly update on integrations, best practices, and upcoming features...	Welcome to the December edition of our newsletter. This month we cover new integration patterns, customer success stories, and our roadmap for 2024.	inbox	t	f	f	\N	\N	{}	2025-12-16 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
0aef92f9-4fab-4a0e-b725-e83160326e7f	Meeting Confirmation: Q4 Review	Calendar	calendar@integratewise.ai	Your meeting has been confirmed for tomorrow at 2:00 PM...	Your Q4 Review meeting has been confirmed. All participants have been notified. Meeting link: https://meet.google.com/abc-defg-hij	inbox	t	f	f	\N	\N	{}	2025-12-17 19:14:23.105225+00	2025-12-17 22:14:23.105225+00
70e57454-76e8-4ff4-99c3-b2c6e7ea45f1	Invoice #INV-2024-156	Billing	billing@client.com	Please find attached the invoice for November services...	Invoice attached for November consulting services. Payment terms: Net 30. Please remit payment to the account specified in the invoice.	inbox	f	f	f	\N	\N	{}	2025-12-17 17:14:23.105225+00	2025-12-17 22:14:23.105225+00
57cd2760-172d-489a-9a55-cca621067b89	New Lead: Enterprise Inquiry	HubSpot	notifications@hubspot.com	A new enterprise lead has submitted an inquiry through your website...	New lead captured: Enterprise Corp has requested information about your integration services. Contact: CEO, Email: ceo@enterprise.com, Company Size: 500+	inbox	f	t	f	\N	\N	{}	2025-12-17 21:44:23.105225+00	2025-12-17 22:14:23.105225+00
\.


--
-- Data for Name: form_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_submissions (id, form_id, page_id, lead_id, visitor_id, session_id, data, source, utm_source, utm_medium, utm_campaign, utm_content, referrer, ip_address, user_agent, country, city, synced_to_hubspot, hubspot_contact_id, created_at) FROM stdin;
\.


--
-- Data for Name: goal_progress_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goal_progress_log (id, goal_id, recorded_at, progress_value, progress_percentage, notes, recorded_by, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: hubspot_sync_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hubspot_sync_log (id, sync_type, direction, status, records_processed, records_created, records_updated, records_failed, started_at, completed_at, error_message, error_details, metadata, created_at) FROM stdin;
8d0a8334-4ff7-4b31-8d7e-c744e906d068	contacts	inbound	completed	150	45	105	0	2025-12-19 21:51:51.657947+00	2025-12-19 21:56:51.657947+00	\N	\N	{}	2025-12-19 22:51:51.657947+00
bbd3afcf-705f-4ec9-8d84-340a4269de7b	deals	inbound	completed	28	8	20	0	2025-12-19 21:51:51.657947+00	2025-12-19 21:53:51.657947+00	\N	\N	{}	2025-12-19 22:51:51.657947+00
909aff9e-1bbb-432e-999c-aff2e08d59e5	companies	inbound	completed	35	12	23	0	2025-12-19 21:51:51.657947+00	2025-12-19 21:54:51.657947+00	\N	\N	{}	2025-12-19 22:51:51.657947+00
46cfe235-4150-4266-b47e-067a3d0ea5c1	forms	inbound	completed	85	85	0	0	2025-12-19 20:51:51.657947+00	2025-12-19 21:01:51.657947+00	\N	\N	{}	2025-12-19 22:51:51.657947+00
f78fc4d3-edd8-405c-9e84-e1e323f04606	contacts	outbound	completed	25	25	0	0	2025-12-19 22:21:51.657947+00	2025-12-19 22:23:51.657947+00	\N	\N	{}	2025-12-19 22:51:51.657947+00
\.


--
-- Data for Name: interactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interactions (id, content, source, source_url, title, embedding, metadata, created_at, updated_at) FROM stdin;
6e14862f-10f0-48e7-b6d0-9bfe622b9936	Q: What is the best pricing strategy for a B2B SaaS? A: Value-based pricing is often most effective for B2B SaaS. Consider: 1) Understand customer value perception, 2) Tier based on usage/features, 3) Annual discounts for commitment, 4) Include implementation/support in pricing.	chatgpt	https://chat.openai.com	Pricing Strategy Research	\N	{"model": "gpt-4", "tokens": 450}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
772fa383-72a0-4ebe-9a8b-e2f0ae5d45db	Q: How to handle sales objections about price? A: Common techniques: 1) Acknowledge the concern, 2) Reframe to value/ROI, 3) Break down cost over time, 4) Compare to cost of not solving the problem, 5) Offer pilot/trial.	chatgpt	https://chat.openai.com	Sales Objection Handling	\N	{"model": "gpt-4", "tokens": 380}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
32791a40-3940-4e32-a935-179e17cb1925	Researched competitor pricing pages: Competitor A offers 3 tiers ($99-$499), Competitor B has usage-based pricing, Competitor C has flat rate with add-ons.	browser	https://competitor.com/pricing	Competitor Pricing Analysis	\N	{"time_spent_seconds": 420}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
734fc1a4-d6ea-4a93-b2d7-c58dea67065e	Q: What are the key metrics for a consulting business? A: 1) MRR/ARR, 2) Pipeline value, 3) Win rate, 4) Average deal size, 5) Client lifetime value, 6) Utilization rate, 7) NPS score.	perplexity	https://perplexity.ai	Consulting Business Metrics	\N	{"sources": 5}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
b8b32988-9a79-49bd-b93f-6ec06ee95eeb	Read article on integration best practices: API-first design, error handling patterns, retry mechanisms, and monitoring strategies.	browser	https://blog.example.com/integration-best-practices	Integration Best Practices Article	\N	{"time_spent_seconds": 600}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lead_activities (id, lead_id, type, subject, description, campaign_id, metadata, performed_by, created_at) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, name, email, phone, company, title, source, source_detail, status, score, tags, linkedin_url, hubspot_id, pipedrive_id, assigned_to, notes, last_contacted_at, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metrics (id, metric_name, metric_value, metric_unit, currency, period_start, period_end, change_percentage, change_direction, metadata, recorded_at) FROM stdin;
e415c21e-394b-4d8a-ae54-e29859bf1f78	mrr	2600000.00	currency	INR	2025-12-01	2025-12-31	12.00	up	{}	2025-12-17 22:14:23.105225+00
16613d8d-4485-4806-b8f8-434a31a47bb2	pipeline	4500000.00	currency	INR	2025-12-01	2025-12-31	8.00	up	{}	2025-12-17 22:14:23.105225+00
44262b93-4491-4237-bbd5-f06db045ee27	revenue	1280000.00	currency	INR	2025-12-01	2025-12-31	5.00	up	{}	2025-12-17 22:14:23.105225+00
0bf70278-5a58-4c81-908c-a178864df0d2	active_projects	3.00	count	\N	2025-12-01	2025-12-31	0.00	neutral	{}	2025-12-17 22:14:23.105225+00
84021024-023e-4418-8e85-860ea43b8055	leads	12.00	count	\N	2025-12-15	2025-12-21	15.00	up	{}	2025-12-17 22:14:23.105225+00
95bdbe80-2e2d-4d90-8600-1053d556118b	posts	16.00	count	\N	2025-12-01	2025-12-31	10.00	up	{}	2025-12-17 22:14:23.105225+00
448e9b7a-cb96-4aef-97e1-ae0cc5fc12c5	followers	1200.00	count	\N	2025-12-01	2025-12-31	5.00	up	{}	2025-12-17 22:14:23.105225+00
\.


--
-- Data for Name: opportunities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.opportunities (id, client_id, service_id, name, value, currency, stage, probability, expected_close_date, owner, source, notes, lost_reason, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: page_views; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.page_views (id, page_id, visitor_id, session_id, referrer, utm_source, utm_medium, utm_campaign, time_on_page, scroll_depth, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, description, tier, tier_name, category, pricing_model, price_min, price_max, currency, is_featured, is_active, icon, color, features, deliverables, ideal_for, external_url, sort_order, metadata, created_at, updated_at) FROM stdin;
4832d1cb-1bc8-4af2-920a-0beade98c0f3	MuleSoft Consulting & Architecture	Enterprise-grade MuleSoft implementation, architecture design, and API strategy for large organizations.	1	Professional Services	Consulting	custom	5000000.00	15000000.00	INR	t	t	Building2	blue	["Full MuleSoft implementation", "API strategy & design", "Architecture review", "Performance optimization", "Security hardening", "Team training"]	["Architecture blueprint", "Implementation roadmap", "API specifications", "Security documentation", "Training materials"]	Large enterprises with complex integration needs	\N	1	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
0df23fee-d996-42cc-a1f9-23373df12c3f	Customer Success Automation	End-to-end automation of customer success workflows including onboarding, health scoring, and churn prediction.	1	Professional Services	Automation	custom	1000000.00	2500000.00	INR	t	t	Users	green	["Customer journey mapping", "Health score automation", "Churn prediction models", "Onboarding workflows", "Renewal automation", "Monthly retainer option"]	["Automation playbooks", "Integration setup", "Dashboard & reports", "Training sessions"]	SaaS companies with 100+ customers	\N	2	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
3f091de8-0be2-4e7c-8d76-66978dd4259f	Integration CTO/Advisory Retainer	Fractional CTO services focused on integration strategy, architecture decisions, and team mentorship.	2	Recurring Revenue	Advisory	monthly	500000.00	1000000.00	INR	t	t	Crown	purple	["Weekly strategy calls", "Architecture reviews", "Vendor evaluation", "Team mentorship", "Technology roadmap", "Board-level reporting"]	["Monthly strategy report", "Architecture recommendations", "Vendor assessment", "Team feedback"]	Growing tech companies needing integration leadership	\N	3	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
1a10b265-f9ff-4353-bd87-b3102869db9e	1:1 Founder/CTO Coaching	Personal coaching for technical founders and CTOs on integration strategy, team building, and scaling.	2	Recurring Revenue	Coaching	monthly	200000.00	500000.00	INR	t	t	GraduationCap	orange	["Weekly 1:1 sessions", "Async support via Slack", "Resource library access", "Peer network intro", "Annual retreat invite"]	["Session recordings", "Action items", "Resource recommendations", "Progress tracking"]	Technical founders scaling from 10 to 100	\N	4	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
088850ad-34d5-477c-8807-c7bca7442b24	Corporate Workshops & Training	Intensive workshops on integration best practices, API design, and MuleSoft for enterprise teams.	3	Scalable	Training	fixed	300000.00	500000.00	INR	f	t	Presentation	teal	["2-3 day intensive program", "Hands-on labs", "Real-world case studies", "Certification prep", "Post-workshop support"]	["Training materials", "Lab exercises", "Certification guide", "Recording access"]	Enterprise IT teams and integration developers	\N	5	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
51fab3ae-9672-403d-9aea-1685627a8ccc	Integration Excellence Certification	Comprehensive certification program validating integration architecture and implementation skills.	3	Scalable	Certification	yearly	200000.00	200000.00	INR	f	t	Award	amber	["Self-paced curriculum", "Live Q&A sessions", "Practical assessments", "Digital badge", "Annual renewal option (₹1L)"]	["Course materials", "Practice exams", "Digital certificate", "LinkedIn badge"]	Integration architects and senior developers	\N	6	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
18198766-57d4-4d0d-8b62-378cb8ce2c8b	Premium CSM Templates	Battle-tested templates for Customer Success Management including playbooks, scorecards, and automation workflows.	4	Digital Products + SaaS	Templates	fixed	24900.00	83000.00	USD	f	t	FileText	pink	["20+ ready-to-use templates", "Notion & Sheets formats", "Video walkthroughs", "Quarterly updates", "Community access"]	["Template library", "Setup guides", "Video tutorials"]	CSM teams and Customer Success leaders	https://templates.integratewise.co	7	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
6ca626d4-f3a1-41db-8c59-d75bdcac88db	AI Agent Suite	Enterprise AI agents for customer support, data analysis, and workflow automation powered by latest LLMs.	4	Digital Products + SaaS	SaaS	monthly	1000000.00	1000000.00	INR	t	t	Bot	violet	["Custom AI agents", "Multi-LLM support", "Enterprise security", "API access", "Dedicated support", "Custom training"]	["Agent deployment", "API documentation", "Training data setup", "Monthly reviews"]	Enterprises looking to automate with AI	\N	8	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
cdf60477-55db-46ea-85e3-1f767534775e	Template Forge AI	AI-powered template generation platform for creating business documents, proposals, and playbooks at scale.	4	Digital Products + SaaS	SaaS	custom	800000.00	2500000.00	INR	t	t	Wand2	emerald	["AI template generation", "Brand customization", "Team collaboration", "Version control", "Analytics dashboard", "API integration"]	["Platform access", "Custom templates", "Team training", "Priority support"]	Agencies and consultancies creating proposals	https://templateforge.ai	9	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
c4143d8f-303f-4cf5-8ea4-336c51299573	Normalize AI	Data normalization and transformation SaaS for cleaning, standardizing, and enriching business data.	4	Digital Products + SaaS	SaaS	custom	500000.00	1500000.00	INR	t	t	Database	cyan	["Automated data cleaning", "Schema normalization", "Duplicate detection", "Data enrichment", "API connectors", "Audit trails"]	["Platform access", "Connector setup", "Data migration support", "Training"]	Data teams dealing with messy integrations	https://normalize.ai	10	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
0a8009bc-41e0-42ac-ad21-be18424218d9	IntegrateWise.co	Referral and partnership program for integration consultants and agencies.	4	Digital Products + SaaS	Referral	custom	0.00	0.00	INR	f	t	Share2	slate	["Partner portal access", "Lead sharing", "Co-marketing", "Revenue share", "Training resources"]	["Partner agreement", "Marketing kit", "Lead tracking"]	Integration consultants and agencies	https://integratewise.co	11	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
a03da35d-03d6-4758-9398-f8a44cb84be7	Integration Architects Community	Exclusive community for integration professionals with resources, networking, and learning opportunities.	5	Community	Community	monthly	0.00	2000.00	INR	f	t	Users2	rose	["Free tier available", "Premium Discord access", "Monthly AMAs", "Job board", "Resource library", "Annual summit invite"]	["Community access", "Resource library", "Event invites", "Peer networking"]	Integration architects and developers	https://community.integratewise.co	12	{}	2025-12-18 00:22:30.32567+00	2025-12-18 00:22:30.32567+00
\.


--
-- Data for Name: project_milestones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_milestones (id, project_id, name, description, due_date, completed_date, status, deliverables, created_at) FROM stdin;
591b8bfc-394b-4502-b63b-8eed76bbe49c	f1daeeba-91f5-41b7-8b7e-8a7f42a629bc	Phase 1: Foundation	Setup MuleSoft environment and basic gateway	2024-11-30	2024-11-28	completed	{"CloudHub environment","API Manager setup","Basic routing"}	2025-12-18 00:18:40.390582+00
241dc8b7-6380-4c91-b722-074077ff4946	f1daeeba-91f5-41b7-8b7e-8a7f42a629bc	Phase 2: Security	Implement authentication and authorization	2024-12-31	\N	in_progress	{"OAuth2 implementation","Rate limiting","IP whitelisting"}	2025-12-18 00:18:40.390582+00
aaa371be-415f-458f-aeb2-3bed6cbe1833	f1daeeba-91f5-41b7-8b7e-8a7f42a629bc	Phase 3: Production	Production deployment and monitoring	2025-01-31	\N	pending	{"Production deployment","Monitoring setup",Documentation}	2025-12-18 00:18:40.390582+00
6391e55a-d61f-49bd-83bc-becb808a3754	486546e5-3b23-4aa4-a6d7-ae497ade8b55	Discovery & Design	Map workflows and design automation	2024-12-15	2024-12-14	completed	{"Workflow documentation","Technical design","Integration specs"}	2025-12-18 00:18:40.390582+00
60d015eb-24bc-4941-afba-2c51501295cd	486546e5-3b23-4aa4-a6d7-ae497ade8b55	Implementation	Build and test automations	2025-01-31	\N	in_progress	{"n8n workflows","Salesforce integration",Testing}	2025-12-18 00:18:40.390582+00
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, client_id, service_id, name, description, status, stage, start_date, end_date, contract_value, currency, billing_type, health_score, owner, tags, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: revenue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revenue (id, client_id, project_id, subscription_id, service_id, tier, amount, currency, type, invoice_number, invoice_date, payment_date, payment_status, notes, metadata, created_at) FROM stdin;
1a86521c-19ac-4e68-bf6f-02821033c830	52067e2c-2fe1-44e0-aff4-7681878d7951	\N	cc6830d9-6467-47d9-872e-87fb5e881861	2e3cb6d1-c50a-4afd-bd35-8d1e22e4d6ee	4	208333.00	INR	subscription	INV-2024-SUB-001	2024-12-01	\N	pending	\N	{}	2025-12-18 03:20:08.256314+00
6324bab8-300c-49f1-a2f8-c62431ef91cd	7357e9f9-b8d0-4856-ba66-9ffb04c31566	\N	356a75c6-d49b-4fe6-9e18-8c4abb537f56	2e3cb6d1-c50a-4afd-bd35-8d1e22e4d6ee	4	208333.00	INR	subscription	INV-2024-SUB-001	2024-12-01	\N	pending	\N	{}	2025-12-18 03:20:08.256314+00
\.


--
-- Data for Name: revenue_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revenue_transactions (id, type, amount, currency, status, client_id, project_id, product_id, stripe_id, razorpay_id, invoice_number, description, metadata, transaction_date, created_at) FROM stdin;
\.


--
-- Data for Name: roi_tracking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roi_tracking (id, entity_type, entity_id, entity_name, period_start, period_end, investment, revenue_generated, leads_generated, deals_closed, customers_acquired, roi_percentage, notes, linked_goal_id, metadata, created_at, updated_at) FROM stdin;
ebbec236-dc0c-4c61-934d-4705fb61aeee	campaign	c3bc67ad-f236-47d2-beac-96c943efc32a	MuleSoft Decision Makers Q4	2024-10-01	2024-12-31	50000.00	2500000.00	45	8	5	4900.00	Highly successful email campaign targeting MuleSoft decision makers	\N	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
5648bfd4-28ce-4b52-a808-4775845f73e7	campaign	a00af635-8690-464f-a998-c2cea1745503	LinkedIn Thought Leadership	2024-01-01	2024-12-31	25000.00	1800000.00	120	15	8	7100.00	Ongoing LinkedIn content strategy	\N	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
f3dfccbe-9f37-4139-822a-f8981c913f4c	campaign	72cc8173-d8d7-4e59-a86c-5e73b4fa81cd	Integration Excellence Webinar Series	2024-01-01	2024-12-31	100000.00	3500000.00	85	12	6	3400.00	Monthly webinar series on integration patterns	\N	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, tier, tier_name, name, description, pricing_type, price_min, price_max, currency, modules, is_active, created_at, updated_at) FROM stdin;
075fab4b-efe1-47f3-883a-76d9d391d32b	1	Professional Services	MuleSoft Consulting & Architecture	Enterprise integration architecture, API design, MuleSoft implementation	fixed	5000000.00	15000000.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
886390e8-b2cb-4d81-94a2-d077b634b22f	1	Professional Services	Customer Success Implementation	End-to-end CS platform implementation and process setup	fixed	1000000.00	2500000.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
3fe36e7f-50c7-4493-9ffb-e146fae938b2	2	Recurring Revenue	Integration CTO/Advisory Retainer	Strategic advisory, architecture reviews, team mentoring	monthly	500000.00	1000000.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
b6526405-4ccc-42a0-a74c-a3d1e4ae1a41	2	Recurring Revenue	1:1 Founder/CTO Coaching	Personal coaching for tech leaders on integration strategy	monthly	200000.00	500000.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
86a0a259-023d-4487-9f38-955f45acca95	3	Scalable	Corporate Workshops & Training	Integration best practices, API-first design, MuleSoft training	fixed	300000.00	500000.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
1e4bd5df-898e-4784-b832-f574bc85aaaa	3	Scalable	Integration Excellence Certification	Professional certification program with annual renewal	yearly	200000.00	300000.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
f4287678-9a50-41af-84ba-f5ccf462e18e	4	SaaS Platform	IntegrateWise.co - Starter	Single module access: Template Forge AI, Normalize AI, or CS Automation Hub	yearly	800000.00	800000.00	INR	["single_module"]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
d3f409fa-1ce9-4687-9f70-77952ee92f0b	4	SaaS Platform	IntegrateWise.co - Growth	Two modules of your choice	yearly	1500000.00	1500000.00	INR	["template_forge_ai", "normalize_ai"]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
2e3cb6d1-c50a-4afd-bd35-8d1e22e4d6ee	4	SaaS Platform	IntegrateWise.co - Enterprise	Full platform access: All 3 modules	yearly	2500000.00	2500000.00	INR	["template_forge_ai", "normalize_ai", "cs_automation_hub"]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
cb674ef2-6353-460d-97da-4123ed3e7179	5	Digital Products	Premium CSM Templates	Ready-to-use templates for customer success management	one-time	25000.00	85000.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
e13b1add-a6ee-4e4e-abe6-54178019eebe	5	Digital Products	AI Agent Suite	AI-powered automation agents for integration workflows	monthly	1000000.00	1000000.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
387ef226-e91a-40a5-baaa-386845c7a4e2	6	Community	Integration Architects Community - Free	Free access to community resources and discussions	one-time	0.00	0.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
f46daf37-9352-4ea0-aff8-c41fb834f60b	6	Community	Integration Architects Community - Premium	Premium membership with exclusive content and networking	monthly	2000.00	2000.00	INR	[]	t	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
\.


--
-- Data for Name: session_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_notes (id, session_id, type, content, assigned_to, due_date, is_completed, completed_at, priority, tags, created_at, updated_at) FROM stdin;
d939076e-b419-40cc-b9a9-1c03699eb46c	1076234c-bde4-476c-875e-0228f17b5081	action_item	Create detailed architecture diagram with all integration points	Nirmal Prince	2024-12-20	t	\N	high	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
b78fbfcb-2f15-4925-a641-9810f0a955a5	1076234c-bde4-476c-875e-0228f17b5081	action_item	Setup MuleSoft Anypoint Platform sandbox environment	Rajesh Kumar	2024-12-15	t	\N	high	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
f6da1bd3-9e5b-4827-a9d6-5acb20afed2e	1076234c-bde4-476c-875e-0228f17b5081	decision	Decided to use API-led connectivity pattern for all new integrations	\N	\N	f	\N	medium	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
30c715c2-c23a-4486-8de4-25ec8e3dc71d	1076234c-bde4-476c-875e-0228f17b5081	insight	Current system has 3 point-to-point integrations that need to be refactored	\N	\N	f	\N	medium	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
b7ee5734-d2f8-4d23-8192-5de9dd916b99	e2bdcf8e-637f-4bff-acab-a484a9b63e94	action_item	Create RAML specifications for top 5 APIs	Dev Team	2024-12-22	f	\N	high	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
c7dda127-f3d1-49a2-8ea0-cffa68074fa0	e2bdcf8e-637f-4bff-acab-a484a9b63e94	note	Team showed strong understanding of REST principles, need more practice on error handling patterns	\N	\N	f	\N	low	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
b5d96ffb-4c5f-4827-a145-72a99e3bf6af	48910647-4b6b-4281-9d7e-dfad14c7ef0e	action_item	Send vendor comparison matrix for iPaaS evaluation	Nirmal Prince	2024-12-15	t	\N	medium	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
8e50441f-0fac-44be-9127-59c565f43a0e	48910647-4b6b-4281-9d7e-dfad14c7ef0e	decision	Approved hiring 2 integration developers in Q1	\N	\N	f	\N	high	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
6e22bf40-54a7-4086-9838-63634bc990ce	332287ce-c4d1-44b6-bfae-701fdf4e82d4	action_item	Document current CS tech stack and integrations	CS Team	2024-12-10	t	\N	high	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
e959a35f-fba1-4bf3-8d27-5a472c2b536f	332287ce-c4d1-44b6-bfae-701fdf4e82d4	blocker	Need access to Salesforce sandbox for integration testing	David Miller	2024-12-12	t	\N	urgent	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, client_id, engagement_id, title, type, status, scheduled_at, duration_minutes, location, attendees, agenda, summary, feedback_rating, feedback_text, recording_url, metadata, created_at, updated_at) FROM stdin;
1076234c-bde4-476c-875e-0228f17b5081	52067e2c-2fe1-44e0-aff4-7681878d7951	c2f1d29c-9de4-489e-8252-d6698617f03c	Architecture Review Session	review	completed	2024-12-10 04:30:00+00	90	https://zoom.us/j/123456	{"Rajesh Kumar","Nirmal Prince"}	Review current architecture and identify gaps	Identified 5 key integration patterns to implement. Client satisfied with recommendations.	5	Excellent session, very insightful recommendations	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
e2bdcf8e-637f-4bff-acab-a484a9b63e94	52067e2c-2fe1-44e0-aff4-7681878d7951	c2f1d29c-9de4-489e-8252-d6698617f03c	API Design Workshop	training	completed	2024-12-15 08:30:00+00	180	https://zoom.us/j/123457	{"Rajesh Kumar","Dev Team","Nirmal Prince"}	API-led connectivity workshop	Trained team on Experience, Process, System API layers. Hands-on exercises completed.	5	Great workshop, team learned a lot	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
48910647-4b6b-4281-9d7e-dfad14c7ef0e	fd708bfb-e077-422a-9935-c73df44fb5e3	c2db7835-7fbb-42ac-9be4-671d2b76407a	Monthly Advisory Call	advisory	completed	2024-12-12 03:30:00+00	60	https://zoom.us/j/234567	{"Sarah Johnson","Nirmal Prince"}	Monthly strategic review	Discussed Q1 roadmap, vendor evaluation for iPaaS, team hiring strategy.	4	Very helpful strategic guidance	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
9b113d3d-935d-4e11-8ade-828d159dc0b4	fd708bfb-e077-422a-9935-c73df44fb5e3	c2db7835-7fbb-42ac-9be4-671d2b76407a	Technical Deep Dive	advisory	scheduled	2024-12-20 04:30:00+00	90	https://zoom.us/j/234568	{"Sarah Johnson","Tech Lead","Nirmal Prince"}	Event-driven architecture review	\N	\N	\N	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
332287ce-c4d1-44b6-bfae-701fdf4e82d4	525f3202-b6fb-4efc-99ce-e16bfc96e6c9	ae7a0174-03e8-403f-86f5-936112ce639f	Discovery Session	discovery	completed	2024-12-05 05:30:00+00	120	https://zoom.us/j/345678	{"David Miller","CS Team","Nirmal Prince"}	Understand current CS workflows and pain points	Mapped 12 manual workflows. Identified top 5 for automation. Created prioritization matrix.	5	Very thorough discovery process	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
acb787de-d7ed-4cc6-aab0-5d2da5d6dbda	b632e7ef-5c5e-4ca1-9ec2-36ed5b8de5e3	24bf7d7f-0547-410a-a5f8-ff96989c032e	Kickoff Meeting	kickoff	scheduled	2024-12-18 09:30:00+00	60	https://zoom.us/j/456789	{"Vikram Reddy","IT Team","Nirmal Prince"}	Project kickoff and scope review	\N	\N	\N	\N	{}	2025-12-18 00:18:40.390582+00	2025-12-18 00:18:40.390582+00
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, client_id, service_id, plan_name, modules, mrr, arr, currency, status, billing_cycle, start_date, renewal_date, cancellation_date, metadata, created_at, updated_at) FROM stdin;
cc6830d9-6467-47d9-872e-87fb5e881861	52067e2c-2fe1-44e0-aff4-7681878d7951	2e3cb6d1-c50a-4afd-bd35-8d1e22e4d6ee	Enterprise	{template_forge_ai,normalize_ai,cs_automation_hub}	208333.00	2500000.00	INR	active	yearly	2024-08-01	2025-08-01	\N	{}	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
356a75c6-d49b-4fe6-9e18-8c4abb537f56	7357e9f9-b8d0-4856-ba66-9ffb04c31566	2e3cb6d1-c50a-4afd-bd35-8d1e22e4d6ee	Enterprise	{template_forge_ai,normalize_ai,cs_automation_hub}	208333.00	2500000.00	INR	active	yearly	2024-08-01	2025-08-01	\N	{}	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
b9ffcd7f-3e6f-4358-8623-0ef2a55ea3de	0a1b74a2-77ba-4283-82ca-f6a8e93394f3	d3f409fa-1ce9-4687-9f70-77952ee92f0b	Growth	{template_forge_ai,normalize_ai}	125000.00	1500000.00	INR	active	yearly	2024-10-01	2025-10-01	\N	{}	2025-12-18 03:20:08.256314+00	2025-12-18 03:20:08.256314+00
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, description, priority, status, due_date, assignee, tags, metadata, created_at, updated_at) FROM stdin;
8f8eb68a-95f5-4a5e-a690-ceba6f2411ba	Review Q4 sales pipeline	Analyze all deals in pipeline and update forecasts	high	in_progress	2025-12-19	Rechetts	{sales,quarterly}	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
b2d0019a-59f9-44a5-86f2-78b0be558100	Update pricing documentation	Reflect new pricing tiers in all materials	high	todo	2025-12-20	Rechetts	{documentation,pricing}	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
5f1db50e-a512-4f92-a270-1a168867c7b8	Client onboarding - TechCorp	Complete kickoff meeting and setup	medium	in_progress	2025-12-22	Team	{client,onboarding}	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
a443afcc-0b3a-43f3-8799-a85c6466ee68	Prepare monthly metrics report	Compile all KPIs for stakeholder review	medium	todo	2025-12-24	Rechetts	{reporting,monthly}	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
1ddd1a76-5ddf-4bb0-bbee-251293d6156f	LinkedIn content calendar	Plan posts for next 2 weeks	low	todo	2025-12-21	Marketing	{marketing,social}	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
b086cbf9-24cd-4581-9514-debda5bd58c6	Security audit preparation	Gather documentation for compliance review	high	todo	2025-12-27	Tech Team	{security,compliance}	{}	2025-12-17 22:14:23.105225+00	2025-12-17 22:14:23.105225+00
\.


--
-- Data for Name: tools_registry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tools_registry (id, name, description, category, tool_type, vendor, url, icon, status, integration_status, api_connected, webhook_url, monthly_cost, currency, used_by, linked_goals, features, metadata, created_at, updated_at) FROM stdin;
de88629a-2e8b-4e35-b9dd-daee3411ef4f	HubSpot CRM	Primary CRM for lead and deal management	crm	saas	HubSpot	https://hubspot.com	users	active	connected	t	\N	0.00	USD	{Sales,Marketing}	{}	{"Contact management","Deal tracking","Email sequences"}	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
4604f861-3000-41b6-b0e1-9b008d9c8e7a	Pipedrive	Sales pipeline management	sales	saas	Pipedrive	https://pipedrive.com	git-branch	active	partial	f	\N	49.00	USD	{Sales}	{}	{"Pipeline visualization","Activity tracking","Sales forecasting"}	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
568a1274-3326-4721-93f3-715fe8a9800b	LinkedIn Sales Navigator	Prospecting and outreach	sales	saas	LinkedIn	https://linkedin.com/sales	linkedin	active	not_connected	f	\N	99.00	USD	{Sales,Marketing}	{}	{"Lead discovery",InMail,"CRM sync"}	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
2cde3f48-c67f-4bfb-a8a7-156adca84da1	Google Analytics	Website and marketing analytics	analytics	saas	Google	https://analytics.google.com	bar-chart	active	partial	t	\N	0.00	USD	{Marketing}	{}	{"Traffic analysis","Conversion tracking","Audience insights"}	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
48c92a7b-f610-488b-9341-0d4a841fd4ee	Asana	Project and task management	productivity	saas	Asana	https://asana.com	check-square	active	connected	t	\N	25.00	USD	{Operations,Delivery}	{}	{"Task management","Project tracking","Team collaboration"}	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
0e2fcf6c-d3ad-4ee7-8985-561b3a060343	Mailchimp	Email marketing campaigns	marketing	saas	Mailchimp	https://mailchimp.com	mail	active	not_connected	f	\N	20.00	USD	{Marketing}	{}	{"Email campaigns",Automation,Analytics}	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
ee1fa753-d595-4f59-bbc6-9753c61e0619	Notion	Knowledge base and documentation	productivity	saas	Notion	https://notion.so	file-text	active	connected	t	\N	10.00	USD	{All}	{}	{Documentation,Wikis,Databases}	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
ea76f1da-a0d0-446b-8ad7-41436f26e04c	Vercel	Hosting and deployment	development	saas	Vercel	https://vercel.com	triangle	active	connected	t	\N	20.00	USD	{Development}	{}	{Hosting,CI/CD,Analytics}	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
92163c62-bded-4280-a641-ab762bad42f5	IntegrateWise OS	Internal operating system	productivity	internal	IntegrateWise	https://os.integratewise.co	layout	active	connected	t	\N	0.00	INR	{All}	{}	{Dashboard,CRM,Analytics,"AI Assistant"}	{}	2025-12-18 04:05:42.551149+00	2025-12-18 04:05:42.551149+00
\.


--
-- Data for Name: webhook_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_notifications (id, channel, notification_type, title, content, metrics, recommendations, alerts, status, slack_response, discord_response, error_message, triggered_by, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: webhook_scheduler_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_scheduler_config (id, channel, webhook_url, is_enabled, frequency, include_metrics, include_recommendations, include_alerts, include_roi, alert_threshold_pipeline, alert_threshold_health, last_sent_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhooks (id, provider, event_type, event_id, payload, signature, signature_valid, processed, processed_at, error_message, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: website_forms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.website_forms (id, name, form_type, page_id, status, fields, submissions_count, conversion_rate, connected_to, hubspot_form_id, webhook_url, thank_you_message, redirect_url, metadata, created_at, updated_at) FROM stdin;
ab287995-caf1-4c2d-aeb5-33b4727a4ec2	Contact Form	contact	a34b8dd1-08a6-4dbb-bfa3-9be4155f4a96	active	[{"name": "name", "type": "text", "required": true}, {"name": "email", "type": "email", "required": true}, {"name": "company", "type": "text", "required": false}, {"name": "message", "type": "textarea", "required": true}]	420	20.00	hubspot	\N	\N	Thank you for contacting us! We will get back to you within 24 hours.	\N	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
f04739eb-cb7b-47b4-b5be-e9716d6b0035	Newsletter Signup	newsletter	d2ecef9f-cefa-4930-b304-098b00be3343	active	[{"name": "email", "type": "email", "required": true}]	850	10.40	hubspot	\N	\N	Welcome! Check your inbox for our latest insights.	\N	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
dc9b61e3-9f66-427c-8b4e-2b16c85daaf4	Free Consultation	consultation	d54f2b30-3ccc-426a-b39c-64fec30e32f3	active	[{"name": "name", "type": "text", "required": true}, {"name": "email", "type": "email", "required": true}, {"name": "company", "type": "text", "required": true}, {"name": "phone", "type": "tel", "required": false}, {"name": "challenge", "type": "textarea", "required": true}]	280	15.60	hubspot	\N	\N	Your consultation is confirmed! You will receive a calendar invite shortly.	\N	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
e0041cb3-2170-428f-91f1-c0b212e86345	Quote Request	quote	49bd78eb-ad31-4a0a-923b-d555a64b8a55	active	[{"name": "name", "type": "text", "required": true}, {"name": "email", "type": "email", "required": true}, {"name": "company", "type": "text", "required": true}, {"name": "service", "type": "select", "required": true}, {"name": "budget", "type": "select", "required": false}]	180	3.20	hubspot	\N	\N	Thank you for your interest! Our team will prepare a custom quote for you.	\N	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
\.


--
-- Data for Name: website_pages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.website_pages (id, title, slug, page_type, status, content, meta_title, meta_description, featured_image, template, author, published_at, scheduled_at, views, unique_visitors, avg_time_on_page, bounce_rate, conversions, seo_score, tags, metadata, created_at, updated_at) FROM stdin;
d2ecef9f-cefa-4930-b304-098b00be3343	Home	/	landing	published	Welcome to IntegrateWise - Your Integration Partner	\N	IntegrateWise helps businesses streamline operations with expert integration consulting	\N	default	\N	2025-09-20 22:51:51.657947+00	\N	12500	8200	45	42.50	320	92	{homepage,integration}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
560bd335-524b-4b8d-9bf9-7e0702ce7b08	About Us	/about	page	published	Learn about IntegrateWise and our mission	\N	Meet the IntegrateWise team and learn about our integration expertise	\N	default	\N	2025-09-20 22:51:51.657947+00	\N	3200	2800	120	35.20	85	88	{about,company}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
49bd78eb-ad31-4a0a-923b-d555a64b8a55	Services	/services	page	published	Our comprehensive integration services	\N	Explore our integration consulting, development, and advisory services	\N	default	\N	2025-09-20 22:51:51.657947+00	\N	5600	4200	90	38.50	180	90	{services,integration}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
a34b8dd1-08a6-4dbb-bfa3-9be4155f4a96	Contact	/contact	page	published	Get in touch with IntegrateWise	\N	Contact us for integration consulting and support	\N	default	\N	2025-09-20 22:51:51.657947+00	\N	2100	1800	60	28.50	420	85	{contact,support}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
fb48079f-e394-43e5-a33c-8e1ac46f5894	MuleSoft Consulting	/services/mulesoft	service	published	Expert MuleSoft consulting and implementation	\N	MuleSoft certified consultants for API-led connectivity	\N	default	\N	2025-10-20 22:51:51.657947+00	\N	2800	2100	180	32.00	95	94	{mulesoft,api,integration}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
d0819ce1-eefd-457c-a581-5572a6e51f32	Integration Patterns Blog	/blog/integration-patterns	blog	published	Learn about modern integration patterns for enterprise systems	\N	A comprehensive guide to enterprise integration patterns	\N	default	\N	2025-11-19 22:51:51.657947+00	\N	4500	3800	240	25.50	45	96	{blog,patterns,integration}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
401daf71-6bd1-4919-88b2-3c63f77a2f6c	API Design Best Practices	/blog/api-design	blog	published	Best practices for designing robust APIs	\N	Learn how to design APIs that scale and perform	\N	default	\N	2025-12-04 22:51:51.657947+00	\N	3200	2700	210	28.00	32	93	{blog,api,design}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
d54f2b30-3ccc-426a-b39c-64fec30e32f3	Free Consultation	/free-consultation	landing	published	Book your free 30-minute consultation	\N	Schedule a free consultation with our integration experts	\N	default	\N	2025-11-04 22:51:51.657947+00	\N	1800	1500	75	22.00	280	89	{consultation,landing,lead-gen}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
807b6752-ad37-4bcb-a230-7a8ae43e00d4	Case Studies	/case-studies	page	published	See our successful integration projects	\N	Real-world integration success stories	\N	default	\N	2025-10-20 22:51:51.657947+00	\N	1500	1200	150	30.00	25	87	{case-studies,success}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
e1da515c-a265-43cf-8f8f-b0759dd1cd72	Pricing	/pricing	page	draft	Our transparent pricing model	\N	IntegrateWise pricing for all service tiers	\N	default	\N	\N	\N	0	0	0	0.00	0	75	{pricing,services}	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
\.


--
-- Data for Name: website_visitors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.website_visitors (id, visitor_id, first_visit, last_visit, total_visits, total_pageviews, total_time_seconds, lead_id, client_id, email, name, company, country, city, device_type, browser, os, first_referrer, first_utm_source, first_utm_campaign, lifecycle_stage, hubspot_contact_id, metadata, created_at, updated_at) FROM stdin;
8cd9c3f3-f3a3-49d8-94ed-85f6b2531fec	vis_001	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00	12	45	3600	\N	\N	sarah@techcorp.com	Sarah Johnson	TechCorp	USA	\N	desktop	Chrome	\N	\N	google	\N	customer	\N	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
afd3b046-75d1-4890-a0c5-ac17c1d95d31	vis_002	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00	8	28	2100	\N	\N	raj@financeplus.in	Raj Patel	FinancePlus	India	\N	desktop	Chrome	\N	\N	linkedin	\N	sql	\N	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
fd534591-475a-456e-98e1-9969927e7865	vis_003	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00	5	15	1200	\N	\N	mike@startup.io	Mike Chen	StartupIO	Singapore	\N	mobile	Safari	\N	\N	twitter	\N	mql	\N	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
8ad6e83c-fedd-4d6b-bda0-b9d02777e525	vis_004	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00	3	8	600	\N	\N	\N	\N	\N	UK	\N	desktop	Firefox	\N	\N	organic	\N	visitor	\N	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
03884cf0-40b9-4c3c-839c-c26d536fc2c0	vis_005	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00	15	62	5400	\N	\N	priya@enterprise.com	Priya Sharma	Enterprise Co	India	\N	desktop	Edge	\N	\N	referral	\N	customer	\N	{}	2025-12-19 22:51:51.657947+00	2025-12-19 22:51:51.657947+00
\.


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: brainstorm_insights brainstorm_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brainstorm_insights
    ADD CONSTRAINT brainstorm_insights_pkey PRIMARY KEY (id);


--
-- Name: brainstorm_sessions brainstorm_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brainstorm_sessions
    ADD CONSTRAINT brainstorm_sessions_pkey PRIMARY KEY (id);


--
-- Name: business_goals business_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_goals
    ADD CONSTRAINT business_goals_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: chat_channels chat_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_channels
    ADD CONSTRAINT chat_channels_pkey PRIMARY KEY (id);


--
-- Name: chat_channels chat_channels_platform_platform_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_channels
    ADD CONSTRAINT chat_channels_platform_platform_id_key UNIQUE (platform, platform_id);


--
-- Name: chat_integrations chat_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_integrations
    ADD CONSTRAINT chat_integrations_pkey PRIMARY KEY (id);


--
-- Name: chat_integrations chat_integrations_platform_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_integrations
    ADD CONSTRAINT chat_integrations_platform_key UNIQUE (platform);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_users chat_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_users
    ADD CONSTRAINT chat_users_pkey PRIMARY KEY (id);


--
-- Name: chat_users chat_users_platform_platform_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_users
    ADD CONSTRAINT chat_users_platform_platform_id_key UNIQUE (platform, platform_id);


--
-- Name: client_engagements client_engagements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_engagements
    ADD CONSTRAINT client_engagements_pkey PRIMARY KEY (id);


--
-- Name: client_projects client_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_projects
    ADD CONSTRAINT client_projects_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: company_values company_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_values
    ADD CONSTRAINT company_values_pkey PRIMARY KEY (id);


--
-- Name: content_library content_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_library
    ADD CONSTRAINT content_library_pkey PRIMARY KEY (id);


--
-- Name: conversion_funnel conversion_funnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversion_funnel
    ADD CONSTRAINT conversion_funnel_pkey PRIMARY KEY (id);


--
-- Name: daily_insights daily_insights_insight_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_insights
    ADD CONSTRAINT daily_insights_insight_date_key UNIQUE (insight_date);


--
-- Name: daily_insights daily_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_insights
    ADD CONSTRAINT daily_insights_pkey PRIMARY KEY (id);


--
-- Name: data_source_sync data_source_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_source_sync
    ADD CONSTRAINT data_source_sync_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: deployments deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: drive_files drive_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drive_files
    ADD CONSTRAINT drive_files_pkey PRIMARY KEY (id);


--
-- Name: emails emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emails
    ADD CONSTRAINT emails_pkey PRIMARY KEY (id);


--
-- Name: form_submissions form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_pkey PRIMARY KEY (id);


--
-- Name: goal_progress_log goal_progress_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_progress_log
    ADD CONSTRAINT goal_progress_log_pkey PRIMARY KEY (id);


--
-- Name: hubspot_sync_log hubspot_sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hubspot_sync_log
    ADD CONSTRAINT hubspot_sync_log_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: metrics metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metrics
    ADD CONSTRAINT metrics_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: project_milestones project_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_milestones
    ADD CONSTRAINT project_milestones_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: revenue revenue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue
    ADD CONSTRAINT revenue_pkey PRIMARY KEY (id);


--
-- Name: revenue_transactions revenue_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_transactions
    ADD CONSTRAINT revenue_transactions_pkey PRIMARY KEY (id);


--
-- Name: roi_tracking roi_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roi_tracking
    ADD CONSTRAINT roi_tracking_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: session_notes session_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_notes
    ADD CONSTRAINT session_notes_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: tools_registry tools_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tools_registry
    ADD CONSTRAINT tools_registry_pkey PRIMARY KEY (id);


--
-- Name: webhook_notifications webhook_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_notifications
    ADD CONSTRAINT webhook_notifications_pkey PRIMARY KEY (id);


--
-- Name: webhook_scheduler_config webhook_scheduler_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_scheduler_config
    ADD CONSTRAINT webhook_scheduler_config_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: website_forms website_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_forms
    ADD CONSTRAINT website_forms_pkey PRIMARY KEY (id);


--
-- Name: website_pages website_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_pages
    ADD CONSTRAINT website_pages_pkey PRIMARY KEY (id);


--
-- Name: website_pages website_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_pages
    ADD CONSTRAINT website_pages_slug_key UNIQUE (slug);


--
-- Name: website_visitors website_visitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_visitors
    ADD CONSTRAINT website_visitors_pkey PRIMARY KEY (id);


--
-- Name: website_visitors website_visitors_visitor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_visitors
    ADD CONSTRAINT website_visitors_visitor_id_key UNIQUE (visitor_id);


--
-- Name: activities_activity_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_activity_type_idx ON public.activities USING btree (activity_type);


--
-- Name: activities_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_created_at_idx ON public.activities USING btree (created_at DESC);


--
-- Name: activities_related_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_related_entity_idx ON public.activities USING btree (related_entity_type, related_entity_id);


--
-- Name: brainstorm_sessions_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brainstorm_sessions_embedding_hnsw ON public.brainstorm_sessions USING hnsw (embedding public.vector_cosine_ops) WITH (m='16', ef_construction='128');


--
-- Name: INDEX brainstorm_sessions_embedding_hnsw; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.brainstorm_sessions_embedding_hnsw IS 'HNSW index for high-quality incremental vector search';


--
-- Name: brainstorm_sessions_embedding_ivfflat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brainstorm_sessions_embedding_ivfflat ON public.brainstorm_sessions USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: INDEX brainstorm_sessions_embedding_ivfflat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.brainstorm_sessions_embedding_ivfflat IS 'IVFFlat index for fast approximate vector search';


--
-- Name: brainstorm_sessions_session_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brainstorm_sessions_session_date_idx ON public.brainstorm_sessions USING btree (session_date DESC);


--
-- Name: brainstorm_sessions_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brainstorm_sessions_source_idx ON public.brainstorm_sessions USING btree (source);


--
-- Name: brainstorm_sessions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brainstorm_sessions_status_idx ON public.brainstorm_sessions USING btree (status);


--
-- Name: brainstorm_sessions_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX brainstorm_sessions_type_idx ON public.brainstorm_sessions USING btree (session_type);


--
-- Name: calendar_events_event_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calendar_events_event_type_idx ON public.calendar_events USING btree (event_type);


--
-- Name: calendar_events_start_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calendar_events_start_time_idx ON public.calendar_events USING btree (start_time);


--
-- Name: documents_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_category_idx ON public.documents USING btree (category);


--
-- Name: documents_content_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_content_search_idx ON public.documents USING gin (to_tsvector('english'::regconfig, ((((title || ' '::text) || content) || ' '::text) || COALESCE(description, ''::text))));


--
-- Name: documents_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_embedding_hnsw ON public.documents USING hnsw (embedding public.vector_cosine_ops) WITH (m='16', ef_construction='128');


--
-- Name: documents_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_embedding_idx ON public.documents USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: documents_embedding_ivfflat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_embedding_ivfflat ON public.documents USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: drive_files_file_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX drive_files_file_type_idx ON public.drive_files USING btree (file_type);


--
-- Name: drive_files_parent_folder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX drive_files_parent_folder_idx ON public.drive_files USING btree (parent_folder_id);


--
-- Name: drive_files_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX drive_files_updated_at_idx ON public.drive_files USING btree (updated_at DESC);


--
-- Name: emails_folder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emails_folder_idx ON public.emails USING btree (folder);


--
-- Name: emails_is_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emails_is_read_idx ON public.emails USING btree (is_read);


--
-- Name: emails_received_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emails_received_at_idx ON public.emails USING btree (received_at DESC);


--
-- Name: emails_thread_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emails_thread_id_idx ON public.emails USING btree (thread_id);


--
-- Name: idx_brainstorm_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brainstorm_date ON public.brainstorm_sessions USING btree (session_date DESC);


--
-- Name: idx_brainstorm_embedding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brainstorm_embedding ON public.brainstorm_sessions USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_brainstorm_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brainstorm_source ON public.brainstorm_sessions USING btree (source);


--
-- Name: idx_brainstorm_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brainstorm_status ON public.brainstorm_sessions USING btree (status);


--
-- Name: idx_brainstorm_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brainstorm_type ON public.brainstorm_sessions USING btree (session_type);


--
-- Name: idx_campaigns_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_dates ON public.campaigns USING btree (start_date, end_date);


--
-- Name: idx_campaigns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status);


--
-- Name: idx_campaigns_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_type ON public.campaigns USING btree (type);


--
-- Name: idx_chat_channels_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_channels_platform ON public.chat_channels USING btree (platform);


--
-- Name: idx_chat_messages_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_channel ON public.chat_messages USING btree (channel_id);


--
-- Name: idx_chat_messages_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_platform ON public.chat_messages USING btree (platform);


--
-- Name: idx_chat_messages_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_sent ON public.chat_messages USING btree (sent_at);


--
-- Name: idx_chat_users_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_users_platform ON public.chat_users USING btree (platform);


--
-- Name: idx_clients_industry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_industry ON public.clients USING btree (industry);


--
-- Name: idx_clients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_status ON public.clients USING btree (status);


--
-- Name: idx_clients_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_tier ON public.clients USING btree (tier);


--
-- Name: idx_content_library_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_library_status ON public.content_library USING btree (status);


--
-- Name: idx_content_library_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_library_type ON public.content_library USING btree (type);


--
-- Name: idx_daily_insights_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_insights_date ON public.daily_insights USING btree (insight_date DESC);


--
-- Name: idx_data_source_sync_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_source_sync_source ON public.data_source_sync USING btree (source);


--
-- Name: idx_data_source_sync_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_source_sync_status ON public.data_source_sync USING btree (status);


--
-- Name: idx_deals_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deals_lead_id ON public.deals USING btree (lead_id);


--
-- Name: idx_deals_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deals_stage ON public.deals USING btree (stage);


--
-- Name: idx_deployments_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deployments_project ON public.deployments USING btree (project_id);


--
-- Name: idx_engagements_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_engagements_client ON public.client_engagements USING btree (client_id);


--
-- Name: idx_forms_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forms_status ON public.website_forms USING btree (status);


--
-- Name: idx_funnel_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funnel_stage ON public.conversion_funnel USING btree (stage);


--
-- Name: idx_funnel_visitor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funnel_visitor ON public.conversion_funnel USING btree (visitor_id);


--
-- Name: idx_goals_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_period ON public.business_goals USING btree (period_type);


--
-- Name: idx_goals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_status ON public.business_goals USING btree (status);


--
-- Name: idx_goals_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_type ON public.business_goals USING btree (goal_type);


--
-- Name: idx_hubspot_sync_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hubspot_sync_type ON public.hubspot_sync_log USING btree (sync_type);


--
-- Name: idx_insights_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insights_priority ON public.brainstorm_insights USING btree (priority);


--
-- Name: idx_insights_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insights_session ON public.brainstorm_insights USING btree (session_id);


--
-- Name: idx_insights_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insights_status ON public.brainstorm_insights USING btree (status);


--
-- Name: idx_insights_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insights_type ON public.brainstorm_insights USING btree (insight_type);


--
-- Name: idx_lead_activities_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_campaign_id ON public.lead_activities USING btree (campaign_id);


--
-- Name: idx_lead_activities_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_created_at ON public.lead_activities USING btree (created_at DESC);


--
-- Name: idx_lead_activities_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities USING btree (lead_id);


--
-- Name: idx_lead_activities_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_type ON public.lead_activities USING btree (type);


--
-- Name: idx_leads_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);


--
-- Name: idx_leads_hubspot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_hubspot_id ON public.leads USING btree (hubspot_id);


--
-- Name: idx_leads_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_score ON public.leads USING btree (score DESC);


--
-- Name: idx_leads_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_source ON public.leads USING btree (source);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- Name: idx_milestones_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_milestones_project ON public.project_milestones USING btree (project_id);


--
-- Name: idx_opportunities_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_stage ON public.opportunities USING btree (stage);


--
-- Name: idx_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pages_slug ON public.website_pages USING btree (slug);


--
-- Name: idx_pages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pages_status ON public.website_pages USING btree (status);


--
-- Name: idx_pages_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pages_type ON public.website_pages USING btree (page_type);


--
-- Name: idx_pageviews_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pageviews_page ON public.page_views USING btree (page_id);


--
-- Name: idx_pageviews_visitor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pageviews_visitor ON public.page_views USING btree (visitor_id);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_featured ON public.products USING btree (is_featured);


--
-- Name: idx_products_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_tier ON public.products USING btree (tier);


--
-- Name: idx_progress_goal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_goal ON public.goal_progress_log USING btree (goal_id);


--
-- Name: idx_projects_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_client ON public.client_projects USING btree (client_id);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_revenue_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_client ON public.revenue USING btree (client_id);


--
-- Name: idx_revenue_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_date ON public.revenue USING btree (invoice_date);


--
-- Name: idx_revenue_transactions_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_transactions_client ON public.revenue_transactions USING btree (client_id);


--
-- Name: idx_revenue_transactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_transactions_date ON public.revenue_transactions USING btree (transaction_date DESC);


--
-- Name: idx_roi_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roi_entity ON public.roi_tracking USING btree (entity_type, entity_id);


--
-- Name: idx_roi_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roi_period ON public.roi_tracking USING btree (period_start, period_end);


--
-- Name: idx_services_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_tier ON public.services USING btree (tier);


--
-- Name: idx_session_notes_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_notes_session ON public.session_notes USING btree (session_id);


--
-- Name: idx_sessions_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_client ON public.sessions USING btree (client_id);


--
-- Name: idx_sessions_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_scheduled ON public.sessions USING btree (scheduled_at);


--
-- Name: idx_submissions_form; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_form ON public.form_submissions USING btree (form_id);


--
-- Name: idx_submissions_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_lead ON public.form_submissions USING btree (lead_id);


--
-- Name: idx_subscriptions_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_client ON public.subscriptions USING btree (client_id);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_tools_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tools_category ON public.tools_registry USING btree (category);


--
-- Name: idx_tools_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tools_status ON public.tools_registry USING btree (status);


--
-- Name: idx_visitors_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitors_email ON public.website_visitors USING btree (email);


--
-- Name: idx_visitors_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitors_lead ON public.website_visitors USING btree (lead_id);


--
-- Name: idx_webhook_notifications_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_notifications_channel ON public.webhook_notifications USING btree (channel);


--
-- Name: idx_webhook_notifications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_notifications_created ON public.webhook_notifications USING btree (created_at DESC);


--
-- Name: idx_webhook_notifications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_notifications_status ON public.webhook_notifications USING btree (status);


--
-- Name: idx_webhook_scheduler_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_scheduler_channel ON public.webhook_scheduler_config USING btree (channel);


--
-- Name: idx_webhooks_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhooks_created_at ON public.webhooks USING btree (created_at DESC);


--
-- Name: idx_webhooks_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhooks_event_type ON public.webhooks USING btree (event_type);


--
-- Name: idx_webhooks_processed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhooks_processed ON public.webhooks USING btree (processed);


--
-- Name: idx_webhooks_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhooks_provider ON public.webhooks USING btree (provider);


--
-- Name: interactions_content_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interactions_content_search_idx ON public.interactions USING gin (to_tsvector('english'::regconfig, content));


--
-- Name: interactions_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interactions_created_at_idx ON public.interactions USING btree (created_at DESC);


--
-- Name: interactions_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interactions_embedding_hnsw ON public.interactions USING hnsw (embedding public.vector_cosine_ops) WITH (m='16', ef_construction='128');


--
-- Name: interactions_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interactions_embedding_idx ON public.interactions USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: interactions_embedding_ivfflat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interactions_embedding_ivfflat ON public.interactions USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: interactions_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interactions_source_idx ON public.interactions USING btree (source);


--
-- Name: metrics_metric_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX metrics_metric_name_idx ON public.metrics USING btree (metric_name);


--
-- Name: metrics_recorded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX metrics_recorded_at_idx ON public.metrics USING btree (recorded_at DESC);


--
-- Name: tasks_due_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_due_date_idx ON public.tasks USING btree (due_date);


--
-- Name: tasks_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_priority_idx ON public.tasks USING btree (priority);


--
-- Name: tasks_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_status_idx ON public.tasks USING btree (status);


--
-- Name: documents documents_broadcast_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER documents_broadcast_trigger AFTER INSERT OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.broadcast_table_changes();


--
-- Name: brainstorm_insights brainstorm_insights_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brainstorm_insights
    ADD CONSTRAINT brainstorm_insights_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.brainstorm_sessions(id) ON DELETE CASCADE;


--
-- Name: business_goals business_goals_parent_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_goals
    ADD CONSTRAINT business_goals_parent_goal_id_fkey FOREIGN KEY (parent_goal_id) REFERENCES public.business_goals(id);


--
-- Name: client_engagements client_engagements_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_engagements
    ADD CONSTRAINT client_engagements_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_projects client_projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_projects
    ADD CONSTRAINT client_projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_projects client_projects_engagement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_projects
    ADD CONSTRAINT client_projects_engagement_id_fkey FOREIGN KEY (engagement_id) REFERENCES public.client_engagements(id) ON DELETE SET NULL;


--
-- Name: conversion_funnel conversion_funnel_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversion_funnel
    ADD CONSTRAINT conversion_funnel_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: conversion_funnel conversion_funnel_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversion_funnel
    ADD CONSTRAINT conversion_funnel_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;


--
-- Name: conversion_funnel conversion_funnel_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversion_funnel
    ADD CONSTRAINT conversion_funnel_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.website_forms(id) ON DELETE SET NULL;


--
-- Name: conversion_funnel conversion_funnel_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversion_funnel
    ADD CONSTRAINT conversion_funnel_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: conversion_funnel conversion_funnel_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversion_funnel
    ADD CONSTRAINT conversion_funnel_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.website_pages(id) ON DELETE SET NULL;


--
-- Name: deals deals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);


--
-- Name: deployments deployments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.client_projects(id) ON DELETE CASCADE;


--
-- Name: drive_files drive_files_parent_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drive_files
    ADD CONSTRAINT drive_files_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.drive_files(id);


--
-- Name: form_submissions form_submissions_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.website_forms(id) ON DELETE CASCADE;


--
-- Name: form_submissions form_submissions_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: form_submissions form_submissions_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.website_pages(id) ON DELETE SET NULL;


--
-- Name: goal_progress_log goal_progress_log_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_progress_log
    ADD CONSTRAINT goal_progress_log_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.business_goals(id) ON DELETE CASCADE;


--
-- Name: lead_activities lead_activities_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: lead_activities lead_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: page_views page_views_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.website_pages(id) ON DELETE CASCADE;


--
-- Name: project_milestones project_milestones_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_milestones
    ADD CONSTRAINT project_milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.client_projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: projects projects_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: revenue revenue_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue
    ADD CONSTRAINT revenue_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: revenue revenue_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue
    ADD CONSTRAINT revenue_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: revenue revenue_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue
    ADD CONSTRAINT revenue_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: revenue revenue_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue
    ADD CONSTRAINT revenue_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- Name: revenue_transactions revenue_transactions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_transactions
    ADD CONSTRAINT revenue_transactions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: revenue_transactions revenue_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_transactions
    ADD CONSTRAINT revenue_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: revenue_transactions revenue_transactions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_transactions
    ADD CONSTRAINT revenue_transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.client_projects(id);


--
-- Name: roi_tracking roi_tracking_linked_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roi_tracking
    ADD CONSTRAINT roi_tracking_linked_goal_id_fkey FOREIGN KEY (linked_goal_id) REFERENCES public.business_goals(id);


--
-- Name: session_notes session_notes_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_notes
    ADD CONSTRAINT session_notes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_engagement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_engagement_id_fkey FOREIGN KEY (engagement_id) REFERENCES public.client_engagements(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: website_forms website_forms_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_forms
    ADD CONSTRAINT website_forms_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.website_pages(id) ON DELETE SET NULL;


--
-- Name: website_visitors website_visitors_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_visitors
    ADD CONSTRAINT website_visitors_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: website_visitors website_visitors_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_visitors
    ADD CONSTRAINT website_visitors_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: clients Allow all access to clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to clients" ON public.clients USING (true);


--
-- Name: opportunities Allow all access to opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to opportunities" ON public.opportunities USING (true);


--
-- Name: products Allow all access to products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to products" ON public.products USING (true);


--
-- Name: projects Allow all access to projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to projects" ON public.projects USING (true);


--
-- Name: revenue Allow all access to revenue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to revenue" ON public.revenue USING (true);


--
-- Name: services Allow all access to services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to services" ON public.services USING (true);


--
-- Name: subscriptions Allow all access to subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all access to subscriptions" ON public.subscriptions USING (true);


--
-- Name: campaigns Allow all campaigns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all campaigns" ON public.campaigns USING (true);


--
-- Name: content_library Allow all content_library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all content_library" ON public.content_library USING (true);


--
-- Name: data_source_sync Allow all data_source_sync; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all data_source_sync" ON public.data_source_sync USING (true);


--
-- Name: deals Allow all deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all deals" ON public.deals USING (true);


--
-- Name: lead_activities Allow all lead_activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all lead_activities" ON public.lead_activities USING (true);


--
-- Name: leads Allow all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all leads" ON public.leads USING (true);


--
-- Name: revenue_transactions Allow all revenue_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all revenue_transactions" ON public.revenue_transactions USING (true);


--
-- Name: activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

--
-- Name: brainstorm_insights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brainstorm_insights ENABLE ROW LEVEL SECURITY;

--
-- Name: brainstorm_insights brainstorm_insights_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY brainstorm_insights_insert_policy ON public.brainstorm_insights FOR INSERT WITH CHECK (true);


--
-- Name: brainstorm_insights brainstorm_insights_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY brainstorm_insights_select_policy ON public.brainstorm_insights FOR SELECT USING (true);


--
-- Name: brainstorm_insights brainstorm_insights_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY brainstorm_insights_update_policy ON public.brainstorm_insights FOR UPDATE USING (true);


--
-- Name: brainstorm_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brainstorm_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: brainstorm_sessions brainstorm_sessions_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY brainstorm_sessions_insert_policy ON public.brainstorm_sessions FOR INSERT WITH CHECK (true);


--
-- Name: brainstorm_sessions brainstorm_sessions_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY brainstorm_sessions_select_policy ON public.brainstorm_sessions FOR SELECT USING (
CASE
    WHEN ((current_setting('app.tenant_id'::text, true) IS NOT NULL) AND (current_setting('app.tenant_id'::text, true) <> ''::text)) THEN
    CASE
        WHEN (EXISTS ( SELECT 1
           FROM information_schema.columns
          WHERE (((columns.table_name)::name = 'brainstorm_sessions'::name) AND ((columns.column_name)::name = 'tenant_id'::name)))) THEN true
        ELSE true
    END
    ELSE true
END);


--
-- Name: POLICY brainstorm_sessions_select_policy ON brainstorm_sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY brainstorm_sessions_select_policy ON public.brainstorm_sessions IS 'Allow users to read brainstorm sessions (tenant-aware when context set)';


--
-- Name: brainstorm_sessions brainstorm_sessions_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY brainstorm_sessions_update_policy ON public.brainstorm_sessions FOR UPDATE USING (true);


--
-- Name: business_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

--
-- Name: campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: client_engagements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_engagements ENABLE ROW LEVEL SECURITY;

--
-- Name: client_projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: company_values; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_values ENABLE ROW LEVEL SECURITY;

--
-- Name: content_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_insights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_insights daily_insights_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY daily_insights_insert_policy ON public.daily_insights FOR INSERT WITH CHECK (true);


--
-- Name: daily_insights daily_insights_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY daily_insights_select_policy ON public.daily_insights FOR SELECT USING (true);


--
-- Name: data_source_sync; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_source_sync ENABLE ROW LEVEL SECURITY;

--
-- Name: deals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

--
-- Name: deployments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: documents documents_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY documents_delete_auth ON public.documents FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) IS NOT NULL));


--
-- Name: documents documents_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY documents_insert_auth ON public.documents FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));


--
-- Name: documents documents_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY documents_select_auth ON public.documents FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) IS NOT NULL));


--
-- Name: documents documents_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY documents_update_auth ON public.documents FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) IS NOT NULL)) WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));


--
-- Name: drive_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.drive_files ENABLE ROW LEVEL SECURITY;

--
-- Name: emails; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

--
-- Name: goal_progress_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goal_progress_log ENABLE ROW LEVEL SECURITY;

--
-- Name: interactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: interactions interactions_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY interactions_delete_auth ON public.interactions FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) IS NOT NULL));


--
-- Name: interactions interactions_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY interactions_insert_auth ON public.interactions FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));


--
-- Name: interactions interactions_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY interactions_select_auth ON public.interactions FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) IS NOT NULL));


--
-- Name: interactions interactions_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY interactions_update_auth ON public.interactions FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) IS NOT NULL)) WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));


--
-- Name: lead_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: project_milestones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: roi_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roi_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: session_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: tools_registry; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tools_registry ENABLE ROW LEVEL SECURITY;

--
-- Name: webhooks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

--
-- Name: webhooks webhooks_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY webhooks_insert_policy ON public.webhooks FOR INSERT WITH CHECK (true);


--
-- Name: webhooks webhooks_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY webhooks_select_policy ON public.webhooks FOR SELECT USING (true);


--
-- Name: POLICY webhooks_select_policy ON webhooks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY webhooks_select_policy ON public.webhooks IS 'Allow all users to read webhooks';


--
-- Name: webhooks webhooks_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY webhooks_update_policy ON public.webhooks FOR UPDATE USING (true);


--
-- PostgreSQL database dump complete
--

\unrestrict m6CEbg717Dw3kzFrH64d3WLcdbDcB2oNW46dJzKSgz2AeX7czU8fVBHWrGcEHtc

