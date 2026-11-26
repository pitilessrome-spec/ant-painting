-- V7 boss drops: one row per item per player per cleared room, so a retried
-- settlement never pays twice and repeat clears add up.
CREATE TABLE IF NOT EXISTS raid_drops (
 season TEXT NOT NULL,
 room_id UUID NOT NULL REFERENCES raid_rooms(id),
 player_id BIGINT NOT NULL REFERENCES players(telegram_id),
 item_code TEXT NOT NULL CHECK (item_code IN ('relic','relic_shard','evolution_core','material','rare_material')),
 boss TEXT NOT NULL CHECK (boss IN ('beetle','spider','prism','frost')),
 tier TEXT NOT NULL CHECK (tier IN ('small','medium','world')),
 quantity INTEGER NOT NULL CHECK (quantity > 0),
 first_clear BOOLEAN NOT NULL DEFAULT false,
 dropped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY (room_id, player_id, item_code)
);
CREATE INDEX IF NOT EXISTS raid_drops_player_idx ON raid_drops(player_id, season);
CREATE INDEX IF NOT EXISTS raid_drops_daily_idx ON raid_drops(player_id, boss, tier, dropped_at);
