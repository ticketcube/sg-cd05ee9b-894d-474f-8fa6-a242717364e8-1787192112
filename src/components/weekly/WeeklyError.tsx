// src/components/weekly/WeeklyError.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface WeeklyErrorProps {
    message?: string;
}

export function WeeklyError({ message = "Something went wrong." }: WeeklyErrorProps) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                {message} Please try refreshing the page.
            </AlertDescription>
        </Alert>
    );
}