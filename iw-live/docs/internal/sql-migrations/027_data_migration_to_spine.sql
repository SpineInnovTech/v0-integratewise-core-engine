-- Data Migration: Legacy to Universal Spine
-- Migrates data from any existing tables to the new universal spine tables
-- Set category to 'personal' for all migrated data by default
-- 1. Migrate Tasks
INSERT INTO spine_tasks (
        id,
        tenant_id,
        entity_type,
        category,
        scope,
        data,
        created_by,
        created_at
    )
SELECT id,
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'),
    -- Use user_id as tenant proxy or default
    'task',
    'personal',
    jsonb_build_object('owner_id', user_id),
    jsonb_build_object(
        'title',
        title,
        'description',
        description,
        'status',
        status,
        'priority',
        priority,
        'due_date',
        due_date
    ),
    user_id,
    created_at
FROM tasks ON CONFLICT (id) DO NOTHING;
-- 2. Migrate Projects
INSERT INTO spine_projects (
        id,
        tenant_id,
        entity_type,
        category,
        scope,
        data,
        created_by,
        created_at
    )
SELECT id,
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'),
    'project',
    'personal',
    jsonb_build_object('owner_id', user_id),
    jsonb_build_object(
        'name',
        name,
        'description',
        description,
        'status',
        status
    ),
    user_id,
    created_at
FROM projects ON CONFLICT (id) DO NOTHING;
-- 3. Migrate Documents (Knowledge)
INSERT INTO spine_documents (
        id,
        tenant_id,
        entity_type,
        category,
        scope,
        data,
        created_by,
        created_at
    )
SELECT id,
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'),
    'document',
    'personal',
    jsonb_build_object('owner_id', user_id),
    jsonb_build_object(
        'title',
        title,
        'content',
        content,
        'file_path',
        file_path,
        'mime_type',
        mime_type
    ),
    user_id,
    created_at
FROM documents ON CONFLICT (id) DO NOTHING;
-- 4. Migrate Goals/Objectives
INSERT INTO spine_objectives (
        id,
        tenant_id,
        entity_type,
        category,
        scope,
        data,
        created_by,
        created_at
    )
SELECT id,
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'),
    'objective',
    'personal',
    jsonb_build_object('owner_id', user_id),
    jsonb_build_object(
        'title',
        title,
        'description',
        description,
        'target_date',
        target_date,
        'status',
        status
    ),
    user_id,
    created_at
FROM goals ON CONFLICT (id) DO NOTHING;
-- 5. Migrate Meetings
INSERT INTO spine_meetings (
        id,
        tenant_id,
        entity_type,
        category,
        scope,
        data,
        created_by,
        created_at
    )
SELECT id,
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'),
    'meeting',
    'personal',
    jsonb_build_object('owner_id', user_id),
    jsonb_build_object(
        'title',
        title,
        'start_time',
        start_time,
        'end_time',
        end_time,
        'agenda',
        agenda,
        'summary',
        summary
    ),
    user_id,
    created_at
FROM meetings ON CONFLICT (id) DO NOTHING;