BEGIN;
CREATE TABLE IF NOT EXISTS games(id text PRIMARY KEY,name text NOT NULL,web_url text NOT NULL);
INSERT INTO games VALUES ('ant-canvas','蚂蚁画布 ANT CANVAS','https://pitilessrome-spec.github.io/ant-painting/'),('boulder-rush','巨石狂潮 Boulder Rush','https://boulder-rush-ten.vercel.app/'),('slot-legion','拉杆军团 Slot Legion','https://slot-legion.vercel.app/') ON CONFLICT(id) DO NOTHING;
CREATE TABLE IF NOT EXISTS partner_users(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, account_code text UNIQUE NOT NULL CHECK(account_code ~ '^[A-Za-z0-9_-]{3,64}$'),display_name text NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS agent_authorizations(user_id bigint PRIMARY KEY REFERENCES partner_users(id),active boolean NOT NULL DEFAULT false,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS role_audit(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id bigint NOT NULL REFERENCES partner_users(id),action text NOT NULL CHECK(action IN ('create_user','grant_agent','revoke_agent')),created_at timestamptz NOT NULL DEFAULT now());
-- No paid enrollment, referral hierarchy, investor acquisition or payout routes.
COMMIT;
