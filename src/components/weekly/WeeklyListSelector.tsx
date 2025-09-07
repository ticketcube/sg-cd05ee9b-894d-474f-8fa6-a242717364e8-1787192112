// src/components/weekly/WeeklyListSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WeeklyList } from '@/types/weekly';

interface WeeklyListSelectorProps {
    lists: WeeklyList[];
    value: string | null;
    onChange: (listId: string) => void;
    disabled: boolean;
}

export function WeeklyListSelector({ lists, value, onChange, disabled }: WeeklyListSelectorProps) {
    return (
        <div className="mb-6 max-w-xs">
            <label htmlFor="weekly-list-selector" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Select Week
            </label>
            <Select onValueChange={onChange} value={value ?? ''} disabled={disabled || lists.length === 0}>
                <SelectTrigger id="weekly-list-selector">
                    <SelectValue placeholder="Select a week..." />
                </SelectTrigger>
                <SelectContent>
                    {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                            {list.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}