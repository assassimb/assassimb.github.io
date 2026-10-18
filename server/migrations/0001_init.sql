-- One row per analysed listing. The full entry lives in `data` (JSON);
-- the other columns exist for ordering and de-duplication.
CREATE TABLE searches (
  id    TEXT PRIMARY KEY,
  at    TEXT NOT NULL,
  link  TEXT,
  data  TEXT NOT NULL
);
CREATE INDEX searches_at ON searches (at DESC);
CREATE UNIQUE INDEX searches_link ON searches (link) WHERE link IS NOT NULL AND link <> '';
