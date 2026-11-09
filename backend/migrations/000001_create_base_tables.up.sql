-- 000001_create_base_tables.up.sql
-- Migrasi: Tabel dasar multi-tenant (tenants, departments, positions, users)
-- Primary Key dan kolom tenant_id menggunakan tipe data UUID.
-- Row-Level Security (RLS) PostgreSQL diterapkan untuk mengisolasi data berdasarkan tenant_id.

-- =============================================================================
-- 1. Ekstensi UUID & Kriptografi
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. Tabel tenants (Perusahaan / Organisasi)
-- =============================================================================
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. Tabel departments (Departemen dalam Tenant)
-- =============================================================================
CREATE TABLE departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_departments_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX idx_departments_tenant_id ON departments(tenant_id);

-- =============================================================================
-- 4. Tabel positions (Jabatan dalam Tenant)
-- =============================================================================
CREATE TABLE positions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_positions_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX idx_positions_tenant_id ON positions(tenant_id);

-- =============================================================================
-- 5. Tabel users (Pengguna / Karyawan dalam Tenant)
-- =============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    department_id   UUID         REFERENCES departments(id) ON DELETE SET NULL,
    position_id     UUID         REFERENCES positions(id) ON DELETE SET NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   TEXT         NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'employee'
                    CHECK (role IN ('owner', 'hrd', 'employee')),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_position_id ON users(position_id);

-- =============================================================================
-- 6. Row-Level Security (RLS) PostgreSQL
--    Mengisolasi data per tenant menggunakan session variable app.current_tenant.
--    Fungsi NULLIF() mencegah error saat session variable kosong / belum di-set.
-- =============================================================================

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy untuk tabel departments
CREATE POLICY tenant_isolation_departments ON departments
    AS PERMISSIVE
    FOR ALL
    TO PUBLIC
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::UUID);

-- Policy untuk tabel positions
CREATE POLICY tenant_isolation_positions ON positions
    AS PERMISSIVE
    FOR ALL
    TO PUBLIC
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::UUID);

-- Policy untuk tabel users
CREATE POLICY tenant_isolation_users ON users
    AS PERMISSIVE
    FOR ALL
    TO PUBLIC
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::UUID);

