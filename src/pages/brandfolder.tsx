
import { withAdminGuard } from "@/components/guards/withAdminGuard";
import { brandfolderUploadPage } from "@/components/brandfolderUploadPage";

function brandfolderUpload() {
  return <brandfolderUploadPage />;
}

export default withAdminGuard(brandfolderUpload);
