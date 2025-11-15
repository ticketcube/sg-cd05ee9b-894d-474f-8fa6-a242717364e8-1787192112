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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
}

export default function CityCombobox({ value, onValueChange, placeholder = "Select city..." }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const fetchCities = async (search?: string) => {
    console.log("Fetching cities directly from Supabase, search:", search);
    setLoading(true);
    try {
      // Query ticketmaster_events directly for unique cities
      let query = supabase
        .from("ticketmaster_events")
        .select("venue_city, venue_state, venue_country")
        .eq("is_active", true)
        .not("venue_city", "is", null);

      // Add search filter if provided
      if (search && search.length >= 2) {
        query = query.ilike("venue_city", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
        return;
      }

      // Deduplicate cities by name
      const cityMap = new Map<string, City>();
      
      data?.forEach((event, index) => {
        const cityName = event.venue_city;
        if (cityName) {
          const normalizedName = cityName.trim();
          if (!cityMap.has(normalizedName)) {
            cityMap.set(normalizedName, {
              id: index,
              name: cityName,
              normalized_name: normalizedName,
              state_code: event.venue_state || undefined,
              country_code: event.venue_country || undefined
            });
          }
        }
      });

      // Convert to array and sort
      const uniqueCities = Array.from(cityMap.values()).sort((a, b) => 
        a.normalized_name.localeCompare(b.normalized_name)
      );

      console.log("Found", uniqueCities.length, "unique cities");
      setCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  // Geolocation function
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setGeoLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location details');
          }
          
          const locationData = await response.json();
          const cityName = locationData.city || locationData.locality || locationData.principalSubdivision;
          
          if (cityName) {
            // Search our cities for a match
            const matchingCity = cities.find((city: City) => 
              city.normalized_name.toLowerCase() === cityName.toLowerCase()
            );
            
            if (matchingCity) {
              onValueChange(matchingCity);
            } else {
              // Use as custom city if not found
              const normalizedCustom = cityName.replace(/\b\w/g, (l: string) => l.toUpperCase());
              onValueChange(null, normalizedCustom);
            }
          } else {
            alert("Could not determine your city from your location. Please select manually.");
          }
        } catch (error) {
          console.error('Error getting city from coordinates:', error);
          alert("Could not determine your city. Please select manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeoLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Location access denied. Please select your city manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information unavailable. Please select your city manually.");
            break;
          case error.TIMEOUT:
            alert("Location request timed out. Please select your city manually.");
            break;
          default:
            alert("An error occurred while getting your location. Please select your city manually.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Initial load of cities
  useEffect(() => {
    fetchCities();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue.length >= 2) {
        fetchCities(searchValue);
      } else if (searchValue.length === 0) {
        fetchCities();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const displayValue = value ? 
    `${value.normalized_name}${value.state_code ? `, ${value.state_code}` : ''}` :
    searchValue.trim() ? 
      `"${searchValue}" - Select below or press Enter` :
      placeholder;

  const handleSelectCity = (cityName: string) => {
    console.log("Selecting city with name:", cityName);
    const selectedCity = cities.find(city => city.normalized_name === cityName);
    if (selectedCity) {
      console.log("Found city:", selectedCity);
      onValueChange(selectedCity);
      setOpen(false);
      setSearchValue(""); // Clear search after selection
    }
  };

  const handleCustomCity = () => {
    if (searchValue.trim()) {
      const normalizedCustom = searchValue.trim().replace(/\b\w/g, l => l.toUpperCase());
      console.log("Adding custom city:", normalizedCustom);
      onValueChange(null, normalizedCustom);
      setOpen(false);
      setSearchValue(""); // Clear search after selection
    }
  };

  // Auto-select if only one city matches and user presses Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && cities.length === 1) {
      e.preventDefault();
      handleSelectCity(cities[0].normalized_name);
    } else if (e.key === "Enter" && cities.length === 0 && searchValue.trim()) {
      e.preventDefault();
      handleCustomCity();
    }
  };

  // Auto-select if only one city matches
  useEffect(() => {
    if (cities.length === 1 && searchValue.length >= 2) {
      console.log("Auto-selecting single matching city:", cities[0]);
    }
  }, [cities, searchValue]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "flex-1 justify-between text-left min-h-[44px]",
                searchValue.trim() && !value && "border-blue-500 ring-2 ring-blue-200 animate-pulse"
              )}
              type="button"
            >
              <span className="truncate">{displayValue}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[99999]" align="start">
            <Command className="w-full">
              <CommandInput 
                placeholder="Type to search cities..."
                value={searchValue}
                onValueChange={setSearchValue}
                onKeyDown={handleKeyDown}
              />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>
                  {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Searching for cities...
                    </div>
                  ) : searchValue.length >= 2 ? (
                    <div className="p-4 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">
                        No existing cities match "{searchValue}"
                      </p>
                      <div className="space-y-2">
                        <Button
                          variant="default"
                          onClick={handleCustomCity}
                          className="w-full"
                          type="button"
                        >
                          ✓ Add "{searchValue}" as my city
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Or press <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs">Enter</kbd>
                        </p>
                      </div>
                    </div>
                  ) : searchValue.length === 1 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <p className="mb-1">Keep typing...</p>
                      <p className="text-xs">Type at least 2 characters</p>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <p className="mb-2">Start typing to search cities</p>
                      <p className="text-xs text-gray-400">Example: "Los Angeles", "New York"</p>
                    </div>
                  )}
                </CommandEmpty>
                {cities.length > 0 && (
                  <CommandGroup>
                    {cities.length === 1 && searchValue.length >= 2 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground bg-blue-50 border-b">
                        💡 Press <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Enter</kbd> to select this city
                      </div>
                    )}
                    {cities.map((city) => (
                      <CommandItem
                        key={city.id}
                        value={city.normalized_name}
                        onSelect={handleSelectCity}
                        className="cursor-pointer"
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
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={getCurrentLocation}
          disabled={geoLoading}
          type="button"
          title="Use current location"
          className="min-h-[44px] min-w-[44px]"
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
