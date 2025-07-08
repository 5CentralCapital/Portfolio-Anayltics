declare namespace google.maps {
  namespace places {
    interface AutocompleteService {
      getPlacePredictions(
        request: AutocompletionRequest,
        callback: (
          predictions: AutocompletePrediction[] | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
    }

    interface AutocompletionRequest {
      input: string;
      componentRestrictions?: {
        country: string | string[];
      };
      types?: string[];
    }

    interface AutocompletePrediction {
      description: string;
      place_id: string;
      structured_formatting: {
        main_text: string;
        secondary_text: string;
      };
    }

    interface PlacesService {
      getDetails(
        request: PlaceDetailsRequest,
        callback: (
          place: PlaceResult | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
    }

    interface PlaceDetailsRequest {
      placeId: string;
      fields: string[];
    }

    interface PlaceResult {
      address_components?: GeocoderAddressComponent[];
      formatted_address?: string;
    }

    enum PlacesServiceStatus {
      OK = 'OK',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      ZERO_RESULTS = 'ZERO_RESULTS',
      NOT_FOUND = 'NOT_FOUND'
    }
  }

  interface GeocoderAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  interface Geocoder {
    geocode(
      request: GeocoderRequest,
      callback: (
        results: GeocoderResult[] | null,
        status: GeocoderStatus
      ) => void
    ): void;
  }

  interface GeocoderRequest {
    address: string;
  }

  interface GeocoderResult {
    address_components: GeocoderAddressComponent[];
    formatted_address: string;
  }

  enum GeocoderStatus {
    OK = 'OK',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
    REQUEST_DENIED = 'REQUEST_DENIED',
    INVALID_REQUEST = 'INVALID_REQUEST',
    ZERO_RESULTS = 'ZERO_RESULTS',
    ERROR = 'ERROR'
  }

  class Map {
    constructor(mapDiv: Element, opts?: any);
  }
}

declare const google: {
  maps: typeof google.maps;
};