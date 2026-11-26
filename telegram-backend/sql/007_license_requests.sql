BEGIN;
CREATE TABLE IF NOT EXISTS game_ops.customer_credentials(user_id bigint PRIMARY KEY REFERENCES game_ops.users(id),salt text NOT NULL,password_hash text NOT NULL,failed int NOT NULL DEFAULT 0,locked_until timestamptz);
CREATE TABLE IF NOT EXISTS game_ops.customer_sessions(token_hash text PRIMARY KEY,user_id bigint NOT NULL REFERENCES game_ops.users(id),expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS game_ops.license_requests(id uuid PRIMARY KEY,user_id bigint NOT NULL REFERENCES game_ops.users(id),game_id text NOT NULL CHECK(game_id IN ('ant-canvas','boulder-rush','slot-legion')),quote_fen integer NOT NULL CHECK(quote_fen=300000),status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','cancelled')),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS license_one_open_idx ON game_ops.license_requests(user_id,game_id) WHERE status IN ('draft','reviewed');
CREATE TABLE IF NOT EXISTS game_ops.license_audit(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id bigint NOT NULL REFERENCES game_ops.users(id),action text NOT NULL CHECK(action IN ('credential_reset','draft_created','reviewed','cancelled')),request_id uuid REFERENCES game_ops.license_requests(id),created_at timestamptz NOT NULL DEFAULT now());
COMMIT;
