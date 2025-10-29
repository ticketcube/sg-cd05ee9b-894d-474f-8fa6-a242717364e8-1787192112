
import { withAdminGuard } from "@/components/guards/withAdminGuard";
import { brandfolderUploadPage } from "@/components/brandfolderUploadPage";

function ArtistLookup() {
  return <ArtistLookupPage />;
}

export default withAdminGuard(ArtistLookup);
