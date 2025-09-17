
import { withAdminGuard } from "@/components/guards/withAdminGuard";
import { ArtistLookupPage } from "@/components/ArtistLookupPage";

function ArtistLookup() {
  return <ArtistLookupPage />;
}

export default withAdminGuard(ArtistLookup);
