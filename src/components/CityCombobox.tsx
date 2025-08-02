
import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
}

export default function CityCombobox({ value, onValueChange, placeholder = "Select city..." }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search function
  const debounceSearch = useCallback((query: string) => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        fetchCities(query);
      } else if (query.length === 0) {
        fetchCities();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  const fetchCities = async (search?: string) => {
    setLoading(true);
    try {
      const url = search ? `/api/cities?search=${encodeURIComponent(search)}` : '/api/cities';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      const data = await response.json();
      setCities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load of cities
  useEffect(() => {
    fetchCities();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const cleanup = debounceSearch(searchQuery);
    return cleanup;
  }, [searchQuery, debounceSearch]);

  const handleSelect = (cityId: string) => {
    const selectedCity = cities.find(city => city.id.toString() === cityId);
    if (selectedCity) {
      onValueChange(selectedCity);
      setOpen(false);
      setSearchQuery(""); // Clear search when city is selected
    }
  };

  const handleCustomInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (searchQuery.trim()) {
      const normalizedCustom = searchQuery.trim().replace(/\b\w/g, l => l.toUpperCase());
      onValueChange(null, normalizedCustom);
      setOpen(false);
      setSearchQuery(""); // Clear search when custom city is added
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter key from bubbling up to parent form
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      
      // If there's a search query and no cities match, allow adding custom city
      if (searchQuery.trim() && cities.length === 0) {
        const normalizedCustom = searchQuery.trim().replace(/\b\w/g, l => l.toUpperCase());
        onValueChange(null, normalizedCustom);
        setOpen(false);
        setSearchQuery("");
      }
    }
  };

  const displayValue = value ? 
    `${value.normalized_name}${value.state_code ? `, ${value.state_code}` : ''}${value.country_code ? ` (${value.country_code})` : ''}` :
    placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left"
          type="button"
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false} onKeyDown={handleKeyDown}>
          <CommandInput
            placeholder="Search cities..."
            value={searchQuery}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading cities...
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No cities found matching "{searchQuery}". You can add your own:
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCustomInput}
                    disabled={!searchQuery.trim()}
                    className="w-full justify-start text-left"
                    type="button"
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    Add "{searchQuery.trim()}"
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search for cities
                </div>
              )}
            </CommandEmpty>
            {cities.length > 0 && (
              <CommandGroup>
                {cities.map((city) => (
                  <CommandItem
                    key={city.id}
                    value={city.id.toString()}
                    onSelect={() => handleSelect(city.id.toString())}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === city.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{city.normalized_name}</div>
                      {(city.state_code || city.country_code) && (
                        <div className="text-sm text-muted-foreground truncate">
                          {city.state_code && city.country_code ? 
                            `${city.state_code}, ${city.country_code}` :
                            city.state_code || city.country_code
                          }
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
  );
}
