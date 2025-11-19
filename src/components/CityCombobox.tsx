import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface City {
    id: number;
    name: string;
    normalized_name: string;
    country_code?: string;
    state_code?: string;
}

interface CityComboboxProps {
    value?: City | null;
    onValueChange: (city: City | null, customInput?: string) => void;
    placeholder?: string;
    className?: string; // <-- added
}

export default function CityCombobox({
    value,
    onValueChange,
    placeholder = "Select city...",
    className,
}: CityComboboxProps) {
    const [open, setOpen] = useState(false);
    const [cities, setCities] = useState < City[] > ([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [geoLoading, setGeoLoading] = useState(false);

    const fetchCities = async (search?: string) => {
        setLoading(true);
        try {
            let query = supabase
                .from("city_latlong")
                .select("id, name, normalized_name, state_code, country_code")
                .not("normalized_name", "is", null);

            if (search && search.length >= 2) query = query.ilike("normalized_name", `%${search}%`);

            query = query.limit(100);

            const { data, error } = await query;

            if (error || !data) {
                setCities([]);
                return;
            }

            setCities(data.sort((a, b) => a.normalized_name.localeCompare(b.normalized_name)));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCities();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchValue.length >= 2) fetchCities(searchValue);
            else if (searchValue.length === 0) fetchCities();
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchValue]);

    const displayValue = value
        ? `${value.normalized_name}${value.state_code ? `, ${value.state_code}` : ""}`
        : searchValue.trim()
            ? `Typing: "${searchValue}"...`
            : placeholder;

    const handleSelectCity = (cityName: string) => {
        const selectedCity = cities.find((c) => c.normalized_name === cityName);
        if (selectedCity) {
            onValueChange(selectedCity);
            setOpen(false);
            setSearchValue("");
        }
    };

    const handleCustomCity = () => {
        if (searchValue.trim()) {
            const normalizedCustom = searchValue
                .trim()
                .replace(/\b\w/g, (l) => l.toUpperCase());
            onValueChange(null, normalizedCustom);
            setOpen(false);
            setSearchValue("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && cities.length === 1) {
            e.preventDefault();
            handleSelectCity(cities[0].normalized_name);
        } else if (e.key === "Enter" && cities.length === 0 && searchValue.trim()) {
            e.preventDefault();
            handleCustomCity();
        }
    };

    return (
        <div className="flex gap-2 items-center">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "flex-1 justify-between text-left min-h-[44px] bg-black text-white border-gray-600 hover:bg-gray-900 focus:bg-gray-900",
                            className // <-- apply parent className
                        )}
                        type="button"
                    >
                        <span className="truncate">{displayValue}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-white opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    className={cn(
                        "w-[var(--radix-popover-trigger-width)] p-0 bg-black text-white max-h-64 overflow-auto",
                        className
                    )}
                >
                    <Command className="w-full">
                        <CommandInput
                            placeholder="Type to search cities..."
                            value={searchValue}
                            onValueChange={setSearchValue}
                            onKeyDown={handleKeyDown}
                            className="bg-black text-white"
                        />
                        <CommandList>
                            <CommandEmpty>
                                {loading ? (
                                    <div className="p-4 text-center text-white">
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                        Searching for cities...
                                    </div>
                                ) : searchValue.length >= 2 ? (
                                    <div className="p-4 text-center text-white">
                                        No existing cities match "{searchValue}"
                                        <Button className="mt-2 w-full" onClick={handleCustomCity}>
                                            ✓ Add "{searchValue}" as my city
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-white">Start typing to search cities</div>
                                )}
                            </CommandEmpty>

                            {cities.length > 0 && (
                                <CommandGroup>
                                    {cities.map((city) => (
                                        <CommandItem
                                            key={city.id}
                                            value={city.normalized_name}
                                            onSelect={handleSelectCity}
                                            className="cursor-pointer text-white"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value?.id === city.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{city.normalized_name}</div>
                                                {(city.state_code || city.country_code) && (
                                                    <div className="text-sm text-gray-400">
                                                        {city.state_code && city.country_code
                                                            ? `${city.state_code}, ${city.country_code}`
                                                            : city.state_code || city.country_code}
                                                    </div>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Button
                variant="outline"
                size="icon"
                onClick={() => alert("Add geolocation")}
                className="min-h-[44px] min-w-[44px] bg-black text-white"
            >
                <MapPin className="h-4 w-4" />
            </Button>
        </div>
    );
}
