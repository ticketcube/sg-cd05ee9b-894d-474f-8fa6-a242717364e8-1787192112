// src/components/weekly/WeeklyLoading.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface WeeklyLoadingProps {
  message?: string;
}

export default function WeeklyLoading({ message = "Loading weekly list..." }: WeeklyLoadingProps) {
  return (
    <Card className="p-8 text-center">
      <CardContent className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">{message}</p>
      </CardContent>
    </Card>
  );
}