import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { withAdminGuard } from "@/components/guards/withAdminGuard";
import { KanbanBoard } from "@/components/ProjectTracker/KanbanBoard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectBoard } from "@/services/projectTrackerService";

function ProjectBoardPage() {
  const router = useRouter();
  const { id } = router.query;
  const [board, setBoard] = useState<ProjectBoard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadBoard(id);
    }
  }, [id]);

  const loadBoard = async (boardId: string) => {
    try {
      const { data, error } = await supabase
        .from("project_boards")
        .select("*")
        .eq("id", boardId)
        .single();

      if (error) throw error;
      setBoard(data);
    } catch (error) {
      console.error("Error loading board:", error);
      router.push("/admin/project-tracker");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/admin/project-tracker")}
            className="text-slate-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">{board.title}</h1>
            {board.description && (
              <p className="text-xs text-slate-500">{board.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Future: Board settings, filters, team members */}
          <Button variant="ghost" size="icon" className="text-slate-400">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard boardId={board.id} />
      </div>
    </div>
  );
}

export default withAdminGuard(ProjectBoardPage);