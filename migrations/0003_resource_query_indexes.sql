-- 0003_resource_query_indexes.sql — indexes for findResources() filters and sorts.
--
-- Query patterns (see resources.repository.ts):
--   WHERE owner_id = $1                          → idx_resources_owner_id (0001)
--   WHERE owner_id = $1 OR EXISTS (shares…)      → 0001 + resource_shares PK / 0002
--   WHERE type = $1 [AND status = $2]            → below
--   ORDER BY id                                  → resources PK
--   ORDER BY created_at [DESC]                   → idx_resources_created_at
--
-- resource_shares EXISTS (resource_id, user_id): PRIMARY KEY (resource_id, user_id).
-- resource_shares user_id lookups: idx_resource_shares_user_id (0002).

CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);

CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);

CREATE INDEX IF NOT EXISTS idx_resources_type_status ON resources(type, status);

CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resources_owner_id_created_at ON resources(owner_id, created_at DESC);
