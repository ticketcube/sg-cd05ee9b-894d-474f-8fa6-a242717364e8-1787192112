import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProjectBoard = Database["public"]["Tables"]["project_boards"]["Row"];
export type ProjectColumn = Database["public"]["Tables"]["project_columns"]["Row"];
export type ProjectTask = Database["public"]["Tables"]["project_tasks"]["Row"];

export type NewBoard = Database["public"]["Tables"]["project_boards"]["Insert"];
export type NewColumn = Database["public"]["Tables"]["project_columns"]["Insert"];
export type NewTask = Database["public"]["Tables"]["project_tasks"]["Insert"];

// ==================== BOARDS ====================

export const getAllBoards = async (): Promise<ProjectBoard[]> => {
  const { data, error } = await supabase
    .from("project_boards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch boards: ${error.message}`);
  return data || [];
};

export const createBoard = async (title: string, description?: string): Promise<ProjectBoard> => {
  const { data, error } = await supabase
    .from("project_boards")
    .insert({ title, description })
    .select()
    .single();

  if (error) throw new Error(`Failed to create board: ${error.message}`);
  return data;
};

export const updateBoard = async (id: string, updates: Partial<NewBoard>): Promise<ProjectBoard> => {
  const { data, error } = await supabase
    .from("project_boards")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update board: ${error.message}`);
  return data;
};

export const deleteBoard = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("project_boards")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete board: ${error.message}`);
};

// ==================== COLUMNS ====================

export const getColumnsByBoard = async (boardId: string): Promise<ProjectColumn[]> => {
  const { data, error } = await supabase
    .from("project_columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (error) throw new Error(`Failed to fetch columns: ${error.message}`);
  return data || [];
};

export const createColumn = async (boardId: string, title: string, color?: string): Promise<ProjectColumn> => {
  // Get max position for this board
  const { data: columns } = await supabase
    .from("project_columns")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: false })
    .limit(1);

  const maxPosition = columns?.[0]?.position ?? -1;

  const { data, error } = await supabase
    .from("project_columns")
    .insert({ 
      board_id: boardId, 
      title, 
      color: color || "#64748b",
      position: maxPosition + 1 
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create column: ${error.message}`);
  return data;
};

export const updateColumn = async (id: string, updates: Partial<NewColumn>): Promise<ProjectColumn> => {
  const { data, error } = await supabase
    .from("project_columns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update column: ${error.message}`);
  return data;
};

export const deleteColumn = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("project_columns")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete column: ${error.message}`);
};

export const reorderColumns = async (boardId: string, columnIds: string[]): Promise<void> => {
  const updates = columnIds.map((id, index) => 
    supabase
      .from("project_columns")
      .update({ position: index })
      .eq("id", id)
  );

  await Promise.all(updates);
};

// ==================== TASKS ====================

export const getTasksByBoard = async (boardId: string): Promise<ProjectTask[]> => {
  const { data, error } = await supabase
    .from("project_tasks")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
  return data || [];
};

export const createTask = async (
  boardId: string,
  columnId: string,
  title: string,
  description?: string
): Promise<ProjectTask> => {
  // Get max position for this column
  const { data: tasks } = await supabase
    .from("project_tasks")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1);

  const maxPosition = tasks?.[0]?.position ?? -1;

  const { data, error } = await supabase
    .from("project_tasks")
    .insert({ 
      board_id: boardId,
      column_id: columnId,
      title,
      description,
      position: maxPosition + 1
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return data;
};

export const updateTask = async (id: string, updates: Partial<NewTask>): Promise<ProjectTask> => {
  const { data, error } = await supabase
    .from("project_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update task: ${error.message}`);
  return data;
};

export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("project_tasks")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete task: ${error.message}`);
};

export const moveTask = async (
  taskId: string,
  newColumnId: string,
  newPosition: number
): Promise<void> => {
  const { error } = await supabase
    .from("project_tasks")
    .update({ column_id: newColumnId, position: newPosition })
    .eq("id", taskId);

  if (error) throw new Error(`Failed to move task: ${error.message}`);
};

export const reorderTasksInColumn = async (columnId: string, taskIds: string[]): Promise<void> => {
  const updates = taskIds.map((id, index) => 
    supabase
      .from("project_tasks")
      .update({ position: index })
      .eq("id", id)
  );

  await Promise.all(updates);
};