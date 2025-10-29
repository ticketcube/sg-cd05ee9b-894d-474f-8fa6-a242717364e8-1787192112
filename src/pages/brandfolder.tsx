import { withAdminGuard } from "@/components/guards/withAdminGuard";
import { BrandfolderUploadPage } from "@/components/brandfolderUploadPage";

function BrandfolderUpload() {
  return <BrandfolderUploadPage />;
}

export default withAdminGuard(BrandfolderUpload);
