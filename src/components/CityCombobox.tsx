
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
    console.log("Fetching cities for query:", search);
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
    `${value.normalized_name}${value.state_code ? `, ${value.state_code}` : ''}${value.country_code ? ` (${value.country_code})` : ''}` :
    placeholder;

  const handleSelectCity = (cityName: string) => {
    console.log("Selecting city with name:", cityName);
    const selectedCity = cities.find(city => city.normalized_name === cityName);
    if (selectedCity) {
      console.log("Found city:", selectedCity);
      onValueChange(selectedCity);
      setOpen(false);
    }
  };

  const handleCustomCity = () => {
    if (searchValue.trim()) {
      const normalizedCustom = searchValue.trim().replace(/\b\w/g, l => l.toUpperCase());
      onValueChange(null, normalizedCustom);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between text-left min-h-[44px]"
              type="button"
            >
              <span className="truncate">{displayValue}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[99999]" align="start">
            <Command className="w-full">
              <CommandInput 
                placeholder="Search cities..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>
                  {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Loading cities...
                    </div>
                  ) : searchValue.length >= 2 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        No cities found matching "{searchValue}"
                      </p>
                      <Button
                        variant="ghost"
                        onClick={handleCustomCity}
                        className="w-full"
                        type="button"
                      >
                        Add "{searchValue}"
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Type to search for cities
                    </div>
                  )}
                </CommandEmpty>
                {cities.length > 0 && (
                  <CommandGroup>
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
