BEGIN;
CREATE SCHEMA IF NOT EXISTS game_ops;
CREATE TABLE IF NOT EXISTS game_ops.users(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,account_code text UNIQUE NOT NULL CHECK(account_code ~ '^[A-Za-z0-9_-]{3,64}$'),display_name text NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS game_ops.agents(user_id bigint PRIMARY KEY REFERENCES game_ops.users(id),active boolean NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS game_ops.audit(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id bigint NOT NULL REFERENCES game_ops.users(id),action text NOT NULL CHECK(action IN ('create_user','grant_agent','revoke_agent')),created_at timestamptz NOT NULL DEFAULT now());
COMMIT;
