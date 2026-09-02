BEGIN;

CREATE SEQUENCE IF NOT EXISTS member_id_sequence START WITH 1;

ALTER TABLE members ADD COLUMN IF NOT EXISTS member_id VARCHAR(32);

WITH numbered_members AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS sequence_number
  FROM members
  WHERE member_id IS NULL
)
UPDATE members
SET member_id = 'GP' || LPAD(numbered_members.sequence_number::TEXT, 4, '0')
FROM numbered_members
WHERE members.id = numbered_members.id;

SELECT setval(
  'member_id_sequence',
  GREATEST(COALESCE((SELECT MAX(NULLIF(SUBSTRING(member_id FROM 3), '')::BIGINT) FROM members), 0), 1),
  (SELECT COUNT(*) > 0 FROM members)
);

ALTER TABLE members
  ALTER COLUMN member_id SET DEFAULT ('GP' || LPAD(nextval('member_id_sequence')::TEXT, 4, '0')),
  ALTER COLUMN member_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_member_id ON members (member_id);

ALTER TABLE attendance DROP CONSTRAINT IF EXISTS chk_attendance_method;
ALTER TABLE attendance ADD CONSTRAINT chk_attendance_method
  CHECK (attendance_method IN ('QR', 'Barcode', 'NFC', 'Manual'));

COMMIT;
