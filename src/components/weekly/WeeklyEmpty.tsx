// src/components/weekly/WeeklyEmpty.tsx
import { Card, CardContent } from '@/components/ui/card';
import { FileX } from 'lucide-react';

interface WeeklyEmptyProps {
  message?: string;
}

export default function WeeklyEmpty({ message = "No weekly list found" }: WeeklyEmptyProps) {
  return (
    <Card className="p-8 text-center">
      <CardContent>
        <FileX className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">{message}</p>
      </CardContent>
    </Card>
  );
}