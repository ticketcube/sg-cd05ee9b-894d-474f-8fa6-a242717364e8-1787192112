-- 1. Fix project_columns: Add color
ALTER TABLE project_columns ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#64748b';

-- 2. Fix project_tasks: Add board_id
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES project_boards(id) ON DELETE CASCADE;

-- 3. Set defaults for created_by to auth.uid() to simplify inserts
ALTER TABLE project_boards ALTER COLUMN created_by SET DEFAULT auth.uid();
ALTER TABLE project_tasks ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 4. Backfill board_id for any existing tasks (unlikely, but good practice)
UPDATE project_tasks 
SET board_id = project_columns.board_id 
FROM project_columns 
WHERE project_tasks.column_id = project_columns.id 
AND project_tasks.board_id IS NULL;