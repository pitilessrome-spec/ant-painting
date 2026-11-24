CREATE TABLE IF NOT EXISTS raid_rooms (
 id UUID PRIMARY KEY, code VARCHAR(12) NOT NULL UNIQUE, owner_id BIGINT NOT NULL REFERENCES players(telegram_id),
 state JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS raid_rooms_owner_idx ON raid_rooms(owner_id,created_at);
CREATE TABLE IF NOT EXISTS raid_first_clears (
 season TEXT NOT NULL, boss TEXT NOT NULL, tier TEXT NOT NULL, assisted BOOLEAN NOT NULL, roster_key TEXT NOT NULL,
 room_id UUID NOT NULL UNIQUE REFERENCES raid_rooms(id), rank INTEGER NOT NULL, members JSONB NOT NULL,
 completed_at TIMESTAMPTZ NOT NULL, duration_ms INTEGER NOT NULL,
 PRIMARY KEY(season,boss,tier,assisted,roster_key), UNIQUE(season,boss,tier,assisted,rank)
);
CREATE TABLE IF NOT EXISTS raid_rewards (
 season TEXT NOT NULL, boss TEXT NOT NULL, tier TEXT NOT NULL, player_id BIGINT NOT NULL REFERENCES players(telegram_id),
 room_id UUID NOT NULL REFERENCES raid_rooms(id), rank INTEGER NOT NULL, granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(season,boss,tier,player_id)
);