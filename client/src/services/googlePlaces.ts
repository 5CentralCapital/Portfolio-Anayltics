interface PlaceResult {
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  place_id: string;
}

interface AddressComponents {
  streetNumber: string;
  route: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

class GooglePlacesService {
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private isLoaded = false;

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    return new Promise(async (resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        this.initializeServices();
        this.isLoaded = true;
        resolve();
        return;
      }

      try {
        // Fetch API key from backend
        const response = await fetch('/api/google-places-key');
        const { apiKey } = await response.json();
      
      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
        script.onload = () => {
          this.initializeServices();
          this.isLoaded = true;
          resolve();
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Google Maps API'));
        };
        
        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }

  private initializeServices(): void {
    this.autocompleteService = new google.maps.places.AutocompleteService();
    this.geocoder = new google.maps.Geocoder();
    
    // Create a dummy div for PlacesService
    const dummyDiv = document.createElement('div');
    const map = new google.maps.Map(dummyDiv);
    this.placesService = new google.maps.places.PlacesService(map);
  }

  async getAddressSuggestions(input: string, countryCode = 'US'): Promise<google.maps.places.AutocompletePrediction[]> {
    if (!this.autocompleteService) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Autocomplete service not available'));
        return;
      }

      this.autocompleteService.getPlacePredictions(
        {
          input: input,
          componentRestrictions: { country: countryCode },
          types: ['address']
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Places API error: ${status}`));
          }
        }
      );
    });
  }

  async getPlaceDetails(placeId: string): Promise<AddressComponents> {
    if (!this.placesService) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Places service not available'));
        return;
      }

      this.placesService.getDetails(
        {
          placeId: placeId,
          fields: ['address_components', 'formatted_address']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const components = this.parseAddressComponents(place.address_components || []);
            resolve(components);
          } else {
            reject(new Error(`Place details error: ${status}`));
          }
        }
      );
    });
  }

  async geocodeAddress(address: string): Promise<AddressComponents> {
    if (!this.geocoder) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder service not available'));
        return;
      }

      this.geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const components = this.parseAddressComponents(results[0].address_components);
          resolve(components);
        } else {
          reject(new Error(`Geocoding error: ${status}`));
        }
      });
    });
  }

  private parseAddressComponents(addressComponents: google.maps.GeocoderAddressComponent[]): AddressComponents {
    const components: AddressComponents = {
      streetNumber: '',
      route: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };

    addressComponents.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        components.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        components.route = component.long_name;
      } else if (types.includes('locality')) {
        components.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        components.state = component.short_name;
      } else if (types.includes('postal_code')) {
        components.zipCode = component.long_name;
      } else if (types.includes('country')) {
        components.country = component.short_name;
      }
    });

    return components;
  }

  formatFullAddress(components: AddressComponents): string {
    const parts = [];
    
    if (components.streetNumber && components.route) {
      parts.push(`${components.streetNumber} ${components.route}`);
    } else if (components.route) {
      parts.push(components.route);
    }
    
    if (components.city) parts.push(components.city);
    if (components.state) parts.push(components.state);
    if (components.zipCode) parts.push(components.zipCode);
    
    return parts.join(', ');
  }

  validateAddress(address: string): boolean {
    // Basic validation - check if address has at least street and city
    const hasNumber = /\d/.test(address);
    const hasStreet = address.trim().length > 10;
    const hasComma = address.includes(',');
    
    return hasNumber && hasStreet && hasComma;
  }
}

export const googlePlacesService = new GooglePlacesService();
export type { AddressComponents };