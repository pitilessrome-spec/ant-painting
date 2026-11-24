CREATE TABLE IF NOT EXISTS village_events (
 actor_id BIGINT NOT NULL REFERENCES players(telegram_id) ON DELETE CASCADE,
 target_id BIGINT NOT NULL REFERENCES players(telegram_id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('like','gift','visit','vote')),
 period DATE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(actor_id,target_id,kind,period),
 CHECK(actor_id<>target_id)
);
CREATE INDEX IF NOT EXISTS village_events_inbox_idx ON village_events(target_id,kind,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS village_one_weekly_vote ON village_events(actor_id,period) WHERE kind='vote';
CREATE TABLE IF NOT EXISTS village_contest (
 entry_id UUID PRIMARY KEY,
 owner_id BIGINT NOT NULL REFERENCES players(telegram_id) ON DELETE CASCADE,
 week DATE NOT NULL,
 region TEXT NOT NULL CHECK(region IN ('garden','forest','island','snow')),
 layout JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 withdrawn BOOLEAN NOT NULL DEFAULT false,
 UNIQUE(owner_id,week)
);