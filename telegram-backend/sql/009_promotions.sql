BEGIN;
CREATE TABLE IF NOT EXISTS game_ops.promotion_codes(
 code text PRIMARY KEY CHECK(code ~ '^ag_[0-9a-f]{24}$'), agent_id bigint UNIQUE NOT NULL REFERENCES game_ops.agents(user_id),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS game_ops.player_attributions(
 telegram_id bigint PRIMARY KEY REFERENCES players(telegram_id) ON DELETE CASCADE,agent_id bigint NOT NULL REFERENCES game_ops.agents(user_id),code text NOT NULL REFERENCES game_ops.promotion_codes(code),created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ops_attribution_agent_idx ON game_ops.player_attributions(agent_id,created_at);
CREATE TABLE IF NOT EXISTS game_ops.promotion_commissions(
 id uuid PRIMARY KEY, agent_id bigint NOT NULL REFERENCES game_ops.agents(user_id),game_id text NOT NULL,channel text NOT NULL,day date NOT NULL,currency text NOT NULL,
 source_revision int NOT NULL,attributed numeric(20,8) NOT NULL CHECK(attributed>0),amount numeric(20,8) NOT NULL CHECK(amount>0),
 evidence_ref text NOT NULL CHECK(length(evidence_ref) BETWEEN 3 AND 240),status text NOT NULL CHECK(status IN ('draft','approved','paid','void')),
 payment_ref text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(game_id,channel,day,currency) REFERENCES game_ops.ad_daily(game_id,channel,day,currency),
 CHECK((status='paid')=(payment_ref IS NOT NULL)));
CREATE UNIQUE INDEX IF NOT EXISTS ops_commission_one_idx ON game_ops.promotion_commissions(agent_id,game_id,channel,day,currency) WHERE status<>'void';
CREATE TABLE IF NOT EXISTS game_ops.commission_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,commission_id uuid NOT NULL REFERENCES game_ops.promotion_commissions(id),action text NOT NULL CHECK(action IN ('draft','approved','paid','void')),created_at timestamptz NOT NULL DEFAULT now());
COMMIT;
