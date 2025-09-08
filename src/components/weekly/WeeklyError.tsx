// src/components/weekly/WeeklyError.tsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface WeeklyErrorProps {
  error: string;
}

export default function WeeklyError({ error }: WeeklyErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}