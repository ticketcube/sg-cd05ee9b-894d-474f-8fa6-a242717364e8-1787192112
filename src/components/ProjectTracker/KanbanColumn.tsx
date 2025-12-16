import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Trash2, Edit2, Loader2 } from "lucide-react";
import {
  createTask,
  updateColumn,
  deleteColumn,
  type ProjectColumn,
  type ProjectTask,
} from "@/services/projectTrackerService";
import { toast } from "sonner";

interface KanbanColumnProps {
  column: ProjectColumn;
  tasks: ProjectTask[];
  onTaskUpdate: (task: ProjectTask) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (task: ProjectTask) => void;
  onColumnUpdate: (column: ProjectColumn) => void;
  onColumnDelete: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  onColumnUpdate,
  onColumnDelete,
}: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [columnTitle, setColumnTitle] = useState(column.title);
  const [loading, setLoading] = useState(false);

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      setLoading(true);
      const newTask = await createTask(
        column.board_id,
        column.id,
        newTaskTitle,
        newTaskDescription || undefined
      );
      onTaskCreate(newTask);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setIsAddingTask(false);
      toast.success("Task created");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateColumn = async () => {
    if (!columnTitle.trim()) return;

    try {
      setLoading(true);
      const updated = await updateColumn(column.id, { title: columnTitle });
      onColumnUpdate(updated);
      setIsEditingColumn(false);
      toast.success("Column updated");
    } catch (error) {
      console.error("Error updating column:", error);
      toast.error("Failed to update column");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (!confirm("Delete this column and all its tasks?")) return;

    try {
      setLoading(true);
      await deleteColumn(column.id);
      onColumnDelete(column.id);
      toast.success("Column deleted");
    } catch (error) {
      console.error("Error deleting column:", error);
      toast.error("Failed to delete column");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-[300px] max-w-[300px]">
      <div className="bg-slate-100 rounded-lg">
        {/* Column Header */}
        <div className="p-3 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color || "#64748b" }}
              />
              <h3 className="font-semibold text-slate-800 truncate">{column.title}</h3>
              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditingColumn(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Column
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteColumn} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            onClick={() => setIsAddingTask(true)}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-600 hover:text-slate-800 hover:bg-slate-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Tasks List */}
        <div ref={setNodeRef} className="p-3 space-y-2 min-h-[200px]">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
          </SortableContext>
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Title *
              </label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Description
              </label>
              <Textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Task description..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={isEditingColumn} onOpenChange={setIsEditingColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Column Name
              </label>
              <Input
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                placeholder="Column name..."
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditingColumn(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateColumn}
                disabled={!columnTitle.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}