// src/components/weekly/WeeklyEmpty.tsx
import { Info } from 'lucide-react';

interface WeeklyEmptyProps {
    message?: string;
}

export function WeeklyEmpty({ message = "There are no weekly lists available right now. Please check back later." }: WeeklyEmptyProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-8 border-2 border-dashed rounded-lg min-h-[200px]">
            <Info className="w-12 h-12 mb-4" />
            <p>{message}</p>
        </div>
    );
}
Once you have created all five files in the src / components / weekly / directory, please respond with "DONE, CHECK MY WORK".


