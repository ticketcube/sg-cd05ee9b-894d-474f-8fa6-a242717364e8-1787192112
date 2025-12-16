import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { withAdminGuard } from "@/components/guards/withAdminGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Layout, Plus, Loader2, ArrowRight, KanbanSquare, Trash2 } from "lucide-react";
import { 
  getAllBoards, 
  createBoard, 
  deleteBoard,
  type ProjectBoard 
} from "@/services/projectTrackerService";
import { toast } from "sonner";
import Link from "next/link";

function ProjectTrackerIndex() {
  const router = useRouter();
  const [boards, setBoards] = useState<ProjectBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await getAllBoards();
      setBoards(data);
    } catch (error) {
      console.error("Error loading boards:", error);
      toast.error("Failed to load project boards");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;

    try {
      setLoading(true);
      const newBoard = await createBoard(newBoardTitle, newBoardDescription || undefined);
      setBoards([newBoard, ...boards]);
      setNewBoardTitle("");
      setNewBoardDescription("");
      setIsCreating(false);
      toast.success("Project board created");
      router.push(`/admin/project-tracker/${newBoard.id}`);
    } catch (error) {
      console.error("Error creating board:", error);
      toast.error("Failed to create board");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this board and all its tasks?")) return;

    try {
      await deleteBoard(id);
      setBoards(boards.filter(b => b.id !== id));
      toast.success("Board deleted");
    } catch (error) {
      console.error("Error deleting board:", error);
      toast.error("Failed to delete board");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/staffdashboard">
              <Button variant="ghost" className="text-slate-500 hover:text-slate-800">
                &larr; Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <KanbanSquare className="w-8 h-8 text-blue-600" />
                Project Tracker
              </h1>
              <p className="text-slate-500 mt-1">Manage projects, tasks, and workflows</p>
            </div>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
                <Plus className="w-5 h-5 mr-2" />
                New Project Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Board Title *
                  </label>
                  <Input
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    placeholder="e.g., Marketing Q4, App Development..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Description
                  </label>
                  <Input
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Brief description of this project..."
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBoard}
                    disabled={!newBoardTitle.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Board
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading && boards.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
                <Layout className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-slate-700">No projects yet</h3>
                <p className="text-slate-500 mb-6">Create your first project board to get started</p>
                <Button onClick={() => setIsCreating(true)} variant="outline">
                  Create Board
                </Button>
              </div>
            ) : (
              boards.map((board) => (
                <Link key={board.id} href={`/admin/project-tracker/${board.id}`}>
                  <Card className="h-full hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group relative">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate pr-8">{board.title}</span>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {board.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-slate-500 mt-4">
                        <Badge variant="secondary" className="bg-slate-100">
                          {new Date(board.created_at).toLocaleDateString()}
                        </Badge>
                        <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                          Open Board <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteBoard(e, board.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAdminGuard(ProjectTrackerIndex);