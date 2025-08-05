
import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface City {
  id: number;
  name: string;
  normalized_name: string;
  country_code?: string;
  state_code?: string;
}

interface SimpleCityInputProps {
  value?: City | null;
  onValueChange: (city: City | null, customInput?: string) => void;
  placeholder?: string;
}

export default function SimpleCityInput({ value, onValueChange, placeholder = "Enter your city..." }: SimpleCityInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef < HTMLDivElement > (null);
  const [clickingDropdown, setClickingDropdown] = useState(false);
  const [hasSelectedCity, setHasSelectedCity] = useState(false);



  const fetchCities = async (search: string) => {
    if (search.length < 2) {
      setCities([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/cities?search=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      const data = await response.json();
      setCities(Array.isArray(data) ? data : []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.trim() && !hasSelectedCity) {
        fetchCities(inputValue.trim());
      } else {
        setCities([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, hasSelectedCity]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasSelectedCity(false); // Reset flag when user types

    
    
    // If user clears the input, clear the selection
    if (!newValue.trim()) {
      onValueChange(null, "");
    }
  };

  const handleCitySelect = (city: City) => {
    setInputValue(city.normalized_name);
    setHasSelectedCity(true); // Mark city as selected
    setShowDropdown(false);
    onValueChange(city);
  };

  const handleInputBlur = () => {
    // Small delay to allow for city selection clicks
    setTimeout(() => {
      if (clickingDropdown) return; // Skip blur logic if clicking dropdown

      if (inputValue.trim() && !value) {
        // User typed something but didn't select from dropdown - treat as custom city
        const normalizedCustom = inputValue.trim().replace(/\b\w/g, l => l.toUpperCase());
        onValueChange(null, normalizedCustom);
      }
      setShowDropdown(false);
    }, 200);
  };

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
          
          if (!response.ok) throw new Error('Failed to get location details');
          
          const locationData = await response.json();
          const cityName = locationData.city || locationData.locality || locationData.principalSubdivision;
          
          if (cityName) {
            setInputValue(cityName);
            // Try to find matching city in database
            const searchResponse = await fetch(`/api/cities?search=${encodeURIComponent(cityName)}`);
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const matchingCity = searchData.find((city: City) => 
                city.normalized_name.toLowerCase() === cityName.toLowerCase()
              );
              
              if (matchingCity) {
                onValueChange(matchingCity);
              } else {
                const normalizedCustom = cityName.replace(/\b\w/g, (l: string) => l.toUpperCase());
                onValueChange(null, normalizedCustom);
              }
            }
          } else {
            alert("Could not determine your city from your location. Please enter manually.");
          }
        } catch (error) {
          console.error('Error getting city from coordinates:', error);
          alert("Could not determine your city. Please enter manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeoLoading(false);
        alert("Location access denied. Please enter your city manually.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Initialize input value from prop
  useEffect(() => {
    if (value) {
      setInputValue(value.normalized_name);
      setHasSelectedCity(true);
    }
  }, [value]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => {
              if (cities.length > 0) {
                setShowDropdown(true);
              }
            }}
            className="w-full pr-8 text-black placeholder:text-gray-500"
          />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
          {!loading && cities.length > 0 && (
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={getCurrentLocation}
          disabled={geoLoading}
          title="Use current location"
          className="min-h-[40px] min-w-[40px]"
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Dropdown */}
      {showDropdown && cities.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
          onMouseDown={() => setClickingDropdown(true)} // Add this line
          onMouseUp={() => setTimeout(() => setClickingDropdown(false), 0)} // And this line
        >
          {cities.map((city) => (
            <div
              key={city.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => handleCitySelect(city)}
            >
              <div className="font-medium text-gray-900">{city.normalized_name}</div>
              {(city.state_code || city.country_code) && (
                <div className="text-sm text-gray-500">
                  {city.state_code && city.country_code ? 
                    `${city.state_code}, ${city.country_code}` :
                    city.state_code || city.country_code
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && cities.length === 0 && inputValue.length >= 2 && !loading && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4 text-center"
        >
          <p className="text-sm text-gray-500 mb-2">
            No cities found matching "{inputValue}"
          </p>
          <p className="text-xs text-gray-400">
            You can still continue with "{inputValue}" as your city
          </p>
        </div>
      )}
    </div>
  );
}
