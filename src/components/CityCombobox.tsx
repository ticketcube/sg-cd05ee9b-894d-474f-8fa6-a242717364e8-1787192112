
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
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
  const [searchValue, setSearchValue] = useState("");
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    const fetchCities = async (search?: string) => {
      setLoading(true);
      try {
        const url = search ? `/api/cities?search=${encodeURIComponent(search)}` : '/api/cities';
        const response = await fetch(url);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  const handleSearch = async (search: string) => {
    setSearchValue(search);
    setCustomInput(search);
    
    if (search.length > 2) {
      setLoading(true);
      try {
        const response = await fetch(`/api/cities?search=${encodeURIComponent(search)}`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error('Error searching cities:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelect = (selectedCity: City) => {
    onValueChange(selectedCity);
    setOpen(false);
    setSearchValue(selectedCity.normalized_name);
    setCustomInput("");
  };

  const handleCustomInput = () => {
    if (customInput.trim()) {
      const normalizedCustom = customInput.trim().replace(/\b\w/g, l => l.toUpperCase());
      onValueChange(null, normalizedCustom);
      setOpen(false);
      setSearchValue(normalizedCustom);
    }
  };

  const displayValue = value ? 
    `${value.normalized_name}${value.state_code ? `, ${value.state_code}` : ''}${value.country_code ? ` (${value.country_code})` : ''}` :
    (customInput || searchValue || placeholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search cities..."
            value={searchValue}
            onValueChange={handleSearch}
          />
          <CommandEmpty>
            {loading ? (
              "Loading cities..."
            ) : (
              <div className="p-2">
                <p className="text-sm text-muted-foreground mb-2">
                  No cities found. You can add your own:
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCustomInput}
                  disabled={!customInput.trim()}
                  className="w-full justify-start"
                >
                  Add "{customInput}"
                </Button>
              </div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {cities.map((city) => (
              <CommandItem
                key={city.id}
                onSelect={() => handleSelect(city)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value?.id === city.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <div className="font-medium">{city.normalized_name}</div>
                  {(city.state_code || city.country_code) && (
                    <div className="text-sm text-muted-foreground">
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
