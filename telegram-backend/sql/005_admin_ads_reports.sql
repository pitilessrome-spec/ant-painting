CREATE TABLE IF NOT EXISTS admin_adsgram_reports (
  platform TEXT NOT NULL CHECK (platform='ANT CANVAS'),
  period_start DATE NOT NULL, period_end DATE NOT NULL,
  impressions BIGINT NOT NULL CHECK (impressions>=0),
  revenue NUMERIC(20,8) NOT NULL CHECK (revenue>=0),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(platform,period_start,period_end),
  CHECK(period_start<=period_end)
);