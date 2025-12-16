import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import {
  getColumnsByBoard,
  getTasksByBoard,
  createColumn,
  moveTask,
  type ProjectColumn,
  type ProjectTask,
} from "@/services/projectTrackerService";
import { toast } from "sonner";

interface KanbanBoardProps {
  boardId: string;
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<ProjectColumn[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  const loadBoardData = async () => {
    try {
      setLoading(true);
      const [columnsData, tasksData] = await Promise.all([
        getColumnsByBoard(boardId),
        getTasksByBoard(boardId),
      ]);
      setColumns(columnsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading board data:", error);
      toast.error("Failed to load board data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;

    try {
      setIsAddingColumn(true);
      const newColumn = await createColumn(boardId, newColumnTitle);
      setColumns([...columns, newColumn]);
      setNewColumnTitle("");
      toast.success("Column added");
    } catch (error) {
      console.error("Error adding column:", error);
      toast.error("Failed to add column");
    } finally {
      setIsAddingColumn(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dropped on a column
    const targetColumn = columns.find((c) => c.id === overId);
    const targetColumnId = targetColumn ? targetColumn.id : overId;

    // If task moved to different column
    if (activeTask.column_id !== targetColumnId) {
      try {
        const tasksInTargetColumn = tasks.filter((t) => t.column_id === targetColumnId);
        const newPosition = tasksInTargetColumn.length;

        await moveTask(activeId, targetColumnId, newPosition);

        // Update local state
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId
              ? { ...t, column_id: targetColumnId, position: newPosition }
              : t
          )
        );

        toast.success("Task moved");
      } catch (error) {
        console.error("Error moving task:", error);
        toast.error("Failed to move task");
        loadBoardData(); // Reload on error
      }
    }
  };

  const handleTaskUpdate = (updatedTask: ProjectTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleColumnUpdate = (updatedColumn: ProjectColumn) => {
    setColumns((prev) => prev.map((c) => (c.id === updatedColumn.id ? updatedColumn : c)));
  };

  const handleColumnDelete = (columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    setTasks((prev) => prev.filter((t) => t.column_id !== columnId));
  };

  const handleTaskCreate = (newTask: ProjectTask) => {
    setTasks((prev) => [...prev, newTask]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasks.filter((t) => t.column_id === column.id)}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onTaskCreate={handleTaskCreate}
                onColumnUpdate={handleColumnUpdate}
                onColumnDelete={handleColumnDelete}
              />
            ))}
          </SortableContext>

          {/* Add New Column */}
          <div className="min-w-[300px] max-w-[300px]">
            <div className="bg-slate-100 rounded-lg p-3">
              <div className="flex gap-2">
                <Input
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Column title..."
                  className="bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddColumn();
                    }
                  }}
                />
                <Button
                  onClick={handleAddColumn}
                  disabled={!newColumnTitle.trim() || isAddingColumn}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAddingColumn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}