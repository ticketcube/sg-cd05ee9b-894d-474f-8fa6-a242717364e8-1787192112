import { useEffect, useState, useCallback } from 'react';
import { artistService } from '@/services/artistService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');

  const checkAdmin = useCallback(async () => {
    if (email) {
      const adminStatus = await artistService.isAdmin(email);
      setIsAdmin(adminStatus);
    }
  }, [email]);

  useEffect(() => {
    // This can be triggered by a button click instead of automatically running
  }, []);

  const handleVerify = () => {
    checkAdmin();
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleVerify}>Verify Access</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {/* Add admin features here */}
    </div>
  );
}
