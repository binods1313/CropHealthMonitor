import { GeoNewsItem } from '../components/EarthBrief';

// Function to get mock coordinates for fallback
const getMockCoordinates = (location: string): { lat: number; lng: number } => {
  // Simple deterministic hash to generate consistent coordinates for a location
  let hash = 0;
  for (let i = 0; i < location.length; i++) {
    hash = location.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate pseudo-random but consistent coordinates based on the location string
  const lat = 20 + (Math.abs(hash) % 60); // Between 20 and 80
  const lng = -100 + (Math.abs(hash) % 80); // Between -100 and -20
  
  return { lat, lng };
};

// Function to geocode using Mapbox API
export const geocodeWithMapbox = async (location: string) => {
  try {
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;
    
    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox API key not configured. Using mock coordinates.');
      const mockCoords = getMockCoordinates(location);
      return {
        lat: mockCoords.lat,
        lng: mockCoords.lng,
        placeName: location,
        relevance: 0.5
      };
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${MAPBOX_TOKEN}&types=place,region,country`
    );
    
    if (!response.ok) {
      throw new Error(`Mapbox geocoding failed with status ${response.status}`);
    }
    
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return {
        lat,
        lng,
        placeName: data.features[0].place_name,
        relevance: data.features[0].relevance
      };
    }

    // Fallback to mock if geocoding fails
    const mockCoords = getMockCoordinates(location);
    return {
      lat: mockCoords.lat,
      lng: mockCoords.lng,
      placeName: location,
      relevance: 0.5
    };
  } catch (error) {
    console.error('Mapbox geocoding failed:', error);
    const mockCoords = getMockCoordinates(location);
    return {
      lat: mockCoords.lat,
      lng: mockCoords.lng,
      placeName: location,
      relevance: 0.5
    };
  }
};

// Function to process news with geocoding
export const processNewsWithGeocoding = async (newsItems: Omit<GeoNewsItem, 'lat' | 'lng'>[]): Promise<GeoNewsItem[]> => {
  return await Promise.all(
    newsItems.map(async (news) => {
      if (news.location) {
        const coords = await geocodeWithMapbox(news.location);
        return { 
          ...news, 
          lat: coords.lat, 
          lng: coords.lng 
        } as GeoNewsItem;
      }
      // If no location, use mock coordinates based on title
      const mockCoords = getMockCoordinates(news.title);
      return { 
        ...news, 
        lat: mockCoords.lat, 
        lng: mockCoords.lng 
      } as GeoNewsItem;
    })
  );
};

// Function to get Mapbox suggestions for autocomplete
export const getMapboxSuggestions = async (searchText: string) => {
  if (searchText.length < 3) {
    return [];
  }

  try {
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;
    
    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox API key not configured for suggestions.');
      return [];
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?access_token=${MAPBOX_TOKEN}&types=place,region,country&limit=5`
    );
    
    if (!response.ok) {
      throw new Error(`Mapbox suggestions failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Mapbox suggestions failed:', error);
    return [];
  }
};