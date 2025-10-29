
import { withAdminGuard } from "@/components/guards/withAdminGuard";
import { StaffDashboard } from "@/components/StaffDashboard";

function StaffDashboardPage() {
  return <StaffDashboard />;
}

export default withAdminGuard(StaffDashboardPage);
