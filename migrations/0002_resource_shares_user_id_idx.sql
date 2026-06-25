-- 0002_resource_shares_user_id_idx.sql — index for member access-scope lookups.

CREATE INDEX IF NOT EXISTS idx_resource_shares_user_id ON resource_shares(user_id);
