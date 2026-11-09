-- 000002_seed_data.up.sql
-- Data Seeding: 1 tenant, 1 department, 1 position, dan 3 user (owner, hrd, employee)
-- Kata sandi di-hash menggunakan algoritma bcrypt (cost factor 12) via ekstensi pgcrypto.
-- Password plaintext default untuk semua user: password123

-- =============================================================================
-- 1. Seed Tenant
-- =============================================================================
INSERT INTO tenants (id, name, slug) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PT OnTrack Indonesia', 'ontrack-indonesia');

-- =============================================================================
-- 2. Seed Department
-- =============================================================================
INSERT INTO departments (id, tenant_id, name) VALUES
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Human Resources');

-- =============================================================================
-- 3. Seed Position
-- =============================================================================
INSERT INTO positions (id, tenant_id, name) VALUES
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Staff');

-- =============================================================================
-- 4. Seed Users (1 owner, 1 hrd, 1 employee)
--    Password: "password123" di-hash dengan bcrypt via pgcrypto crypt(..., gen_salt('bf', 12))
-- =============================================================================
INSERT INTO users (id, tenant_id, department_id, position_id, email, password_hash, full_name, role, is_active) VALUES
    (
        'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        NULL,
        NULL,
        'owner@ontrack.id',
        crypt('password123', gen_salt('bf', 12)),
        'Owner OnTrack',
        'owner',
        TRUE
    ),
    (
        'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'hrd@ontrack.id',
        crypt('password123', gen_salt('bf', 12)),
        'HRD OnTrack',
        'hrd',
        TRUE
    ),
    (
        'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'employee@ontrack.id',
        crypt('password123', gen_salt('bf', 12)),
        'Employee OnTrack',
        'employee',
        TRUE
    );

