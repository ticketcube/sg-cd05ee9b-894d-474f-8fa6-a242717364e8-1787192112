import { useState, useEffect, useCallback } from "react";
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
  const [geoLoading, setGeoLoading] = useState(false);

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
          
          // Use a free geocoding service to get city name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location details');
          }
          
          const locationData = await response.json();
          const cityName = locationData.city || locationData.locality || locationData.principalSubdivision;
          
          if (cityName) {
            // Try to find the city in our database first
            const searchResponse = await fetch(`/api/cities?search=${encodeURIComponent(cityName)}`);
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const matchingCity = searchData.find((city: City) => 
                city.normalized_name.toLowerCase() === cityName.toLowerCase()
              );
              
              if (matchingCity) {
                onValueChange(matchingCity);
              } else {
                // Use as custom city if not found in database
                const normalizedCustom = cityName.replace(/\b\w/g, (l: string) => l.toUpperCase());
                onValueChange(null, normalizedCustom);
              }
            } else {
              // Fallback to custom city
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

  // Handle search with debouncing
  useEffect(() => {
    const cleanup = debounceSearch(searchQuery);
    return cleanup;
  }, [searchQuery, debounceSearch]);

  const handleSelectCity = (city: City) => {
    onValueChange(city);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCustomInput = () => {
    if (searchQuery.trim()) {
      const normalizedCustom = searchQuery.trim().replace(/\b\w/g, l => l.toUpperCase());
      onValueChange(null, normalizedCustom);
      setOpen(false);
      setSearchQuery("");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      
      if (searchQuery.trim() && cities.length === 0) {
        handleCustomInput();
      }
    }
  };

  const displayValue = value ? 
    `${value.normalized_name}${value.state_code ? `, ${value.state_code}` : ''}${value.country_code ? ` (${value.country_code})` : ''}` :
    placeholder;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between text-left"
              type="button"
            >
              <span className="truncate">{displayValue}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 z-50" align="start" style={{ pointerEvents: 'auto' }}>
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search cities..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleInputKeyDown}
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
                        value={city.normalized_name}
                        onSelect={() => handleSelectCity(city)}
                        className="cursor-pointer hover:bg-accent"
                        style={{ pointerEvents: 'auto' }}
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

        <Button
          variant="outline"
          size="icon"
          onClick={getCurrentLocation}
          disabled={geoLoading}
          type="button"
          title="Use current location"
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
