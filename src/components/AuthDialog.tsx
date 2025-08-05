import { useEffect, useState } from "react";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import cities from "@/data/cities.json"; // ensure this is an array of city strings
import { normalizeCity } from "@/lib/utils"; // ensure this utility exists and works properly

interface CitySelectorProps {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

export const CitySelector = ({ selectedCity, setSelectedCity }: CitySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] = useState < string[] > (cities);
  const [customCity, setCustomCity] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    const filtered = cities.filter((city) =>
      city.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCities([...filtered, "Other"]);
  }, [searchQuery]);

  const handleCitySelect = (city: string) => {
    if (city === "Other") {
      setShowCustomInput(true);
    } else {
      setSelectedCity(city);
      setShowCustomInput(false);
      setOpen(false);
    }
  };

  const handleCustomCitySubmit = () => {
    const normalized = normalizeCity(customCity);
    setSelectedCity(normalized);
    setShowCustomInput(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {selectedCity || "Select a city..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[250px] p-0 z-50" align="start" style={{ pointerEvents: 'auto' }}>
        {!showCustomInput ? (
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search cities..."
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            />
            <CommandList>
              {filteredCities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => handleCitySelect(city)}
                >
                  <Check
                    className={
                      "mr-2 h-4 w-4" + (selectedCity === city ? " opacity-100" : " opacity-0")
                    }
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        ) : (
          <div className="p-4 space-y-2">
            <input
              type="text"
              placeholder="Enter your city"
              className="w-full border px-2 py-1 rounded"
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleCustomCitySubmit}
              disabled={!customCity.trim()}
            >
              Submit
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
