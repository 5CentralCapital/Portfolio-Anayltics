import { useState, useEffect, useRef } from 'react';
import { googlePlacesService, AddressComponents } from '../services/googlePlaces';
import { MapPin, X } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, components?: AddressComponents) => void;
  onCityChange?: (city: string) => void;
  onStateChange?: (state: string) => void;
  onZipChange?: (zipCode: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onCityChange,
  onStateChange,
  onZipChange,
  placeholder = "Enter property address...",
  className = "",
  disabled = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const initializeGooglePlaces = async () => {
      try {
        await googlePlacesService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Google Places:', error);
      }
    };

    initializeGooglePlaces();
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (!isInitialized || input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const predictions = await googlePlacesService.getAddressSuggestions(input);
      setSuggestions(predictions);
      setShowSuggestions(predictions.length > 0);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Debounce API calls
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
  };

  const handleSuggestionSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    try {
      setIsLoading(true);
      const components = await googlePlacesService.getPlaceDetails(prediction.place_id);
      const fullAddress = googlePlacesService.formatFullAddress(components);
      
      onChange(fullAddress, components);
      
      // Update individual fields if callbacks provided
      if (onCityChange) onCityChange(components.city);
      if (onStateChange) onStateChange(components.state);
      if (onZipChange) onZipChange(components.zipCode);
      
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback to the suggestion text
      onChange(prediction.description);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicking
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const clearInput = () => {
    onChange('');
    if (onCityChange) onCityChange('');
    if (onStateChange) onStateChange('');
    if (onZipChange) onZipChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none text-gray-900 dark:text-white"
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isInitialized && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md text-xs text-yellow-800 dark:text-yellow-200">
          Loading address autocomplete...
        </div>
      )}
    </div>
  );
}