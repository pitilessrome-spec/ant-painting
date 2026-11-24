-- Run after 001_init.sql. No existing player data is replaced.
BEGIN;
CREATE TABLE IF NOT EXISTS player_backups (
 telegram_id BIGINT PRIMARY KEY REFERENCES players(telegram_id) ON DELETE CASCADE,
 revision INTEGER NOT NULL CHECK(revision>0),
 save JSONB NOT NULL CHECK(jsonb_typeof(save)='object'),
 public_village BOOLEAN NOT NULL DEFAULT false,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS player_referrals (
 invitee_id BIGINT PRIMARY KEY REFERENCES players(telegram_id) ON DELETE CASCADE,
 inviter_id BIGINT NOT NULL REFERENCES players(telegram_id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(invitee_id<>inviter_id)
);
CREATE INDEX IF NOT EXISTS player_referrals_inviter_idx ON player_referrals(inviter_id);
COMMIT;
