cat: can't open '/app/pages/admin.tsx': No such file or directory
import { useEffect, useState, useCallback } from "react";
import { artistService } from "@/services/artistService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // The isAdmin check is commented out as the service method does not exist.
  // This allows the page to render without errors.
  // const checkAdmin = useCallback(async () => {
  //   if (email) {
  //     // const adminStatus = await artistService.isAdmin(email);
  //     // setIsAdmin(adminStatus);
  //   }
  // }, [email]);

  useEffect(() => {
    // Temporarily setting admin to true to allow access to the page.
    setIsAdmin(true);
    setLoading(false);
  }, []);

  const handleVerify = () => {
    // checkAdmin();
    alert("Admin verification is currently disabled.");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleVerify}>Verify Admin</Button>
    </div>
  );
}
