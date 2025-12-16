-- Create project_boards table
CREATE TABLE IF NOT EXISTS project_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for otwstaff only
CREATE POLICY "otwstaff can view all boards" ON project_boards 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

CREATE POLICY "otwstaff can create boards" ON project_boards 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

CREATE POLICY "otwstaff can update boards" ON project_boards 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

CREATE POLICY "otwstaff can delete boards" ON project_boards 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

-- Create project_columns table
CREATE TABLE IF NOT EXISTS project_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES project_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_columns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for otwstaff only
CREATE POLICY "otwstaff can view all columns" ON project_columns 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

CREATE POLICY "otwstaff can create columns" ON project_columns 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

CREATE POLICY "otwstaff can update columns" ON project_columns 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

CREATE POLICY "otwstaff can delete columns" ON project_columns 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID NOT NULL REFERENCES project_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for otwstaff only
CREATE POLICY "otwstaff can view all tasks" ON project_tasks 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

CREATE POLICY "otwstaff can create tasks" ON project_tasks 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

CREATE POLICY "otwstaff can update tasks" ON project_tasks 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

CREATE POLICY "otwstaff can delete tasks" ON project_tasks 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'otwstaff'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_project_columns_board_id ON project_columns(board_id);
CREATE INDEX idx_project_columns_position ON project_columns(position);
CREATE INDEX idx_project_tasks_column_id ON project_tasks(column_id);
CREATE INDEX idx_project_tasks_position ON project_tasks(position);
CREATE INDEX idx_project_tasks_assigned_to ON project_tasks(assigned_to);