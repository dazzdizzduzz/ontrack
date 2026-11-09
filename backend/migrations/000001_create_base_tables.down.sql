-- 000001_create_base_tables.down.sql
-- Rollback: Hapus kebijakan RLS dan seluruh tabel dasar

DROP POLICY IF EXISTS tenant_isolation_users ON users;
DROP POLICY IF EXISTS tenant_isolation_positions ON positions;
DROP POLICY IF EXISTS tenant_isolation_departments ON departments;

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

