
import { withAdminGuard } from "@/components/guards/withAdminGuard";
import { brandfolderUploadPage } from "@/components/brandfolderUploadPage";

function brandfolderUpload() {
  return <brandfolderUpload />;
}

export default withAdminGuard(brandfolderUpload);
