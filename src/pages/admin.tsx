
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock admin check - in a real app, this would involve a secure check
const checkAdminAccess = async (email: string): Promise<boolean> => {
  // For now, let's say only a specific email is admin
  return email === "admin@otw.com";
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you might check a token from localStorage here
    setLoading(false);
  }, []);

  const handleVerify = async () => {
    setLoading(true);
    const adminStatus = await checkAdminAccess(email);
    setIsAdmin(adminStatus);
    setLoading(false);
    if (!adminStatus) {
      alert("Access Denied. Please check the email and try again.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          <Button onClick={handleVerify} className="w-full">
            Verify Access
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome, Admin! Admin features would be displayed here.</p>
      {/* Add admin features here */}
    </div>
  );
}
