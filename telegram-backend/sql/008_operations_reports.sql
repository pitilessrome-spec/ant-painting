BEGIN;
CREATE TABLE IF NOT EXISTS game_ops.service_contracts(
 id uuid PRIMARY KEY, request_id uuid UNIQUE NOT NULL REFERENCES game_ops.license_requests(id),
 reference text UNIQUE NOT NULL CHECK(length(reference) BETWEEN 3 AND 120),
 scope text NOT NULL CHECK(length(scope) BETWEEN 10 AND 1000),
 start_date date NOT NULL, end_date date NOT NULL CHECK(end_date>=start_date),
 status text NOT NULL CHECK(status IN ('active','ended')), created_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz);
CREATE TABLE IF NOT EXISTS game_ops.ad_daily(
 game_id text NOT NULL CHECK(game_id IN ('ant-canvas','boulder-rush','slot-legion')),
 channel text NOT NULL CHECK(channel IN ('telegram','wechat','douyin','tiktok','crazygames','gamedistribution')),
 day date NOT NULL, currency text NOT NULL CHECK(currency IN ('CNY','USD','USDT','EUR')),
 estimated numeric(20,8) NOT NULL CHECK(estimated>=0),
 confirmed numeric(20,8) CHECK(confirmed>=0), received numeric(20,8) CHECK(received>=0),
 source_ref text NOT NULL CHECK(length(source_ref) BETWEEN 3 AND 240),
 revision int NOT NULL CHECK(revision>0), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(game_id,channel,day,currency));
CREATE TABLE IF NOT EXISTS game_ops.ad_daily_revisions(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, game_id text NOT NULL, channel text NOT NULL, day date NOT NULL, currency text NOT NULL,
 revision int NOT NULL, estimated numeric(20,8) NOT NULL, confirmed numeric(20,8), received numeric(20,8), source_ref text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(game_id,channel,day,currency,revision));
CREATE TABLE IF NOT EXISTS game_ops.service_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, contract_id uuid NOT NULL REFERENCES game_ops.service_contracts(id),
 action text NOT NULL CHECK(action IN ('record_contract','end_contract')), created_at timestamptz NOT NULL DEFAULT now());
COMMIT;
