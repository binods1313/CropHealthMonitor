
import { FarmData, Region, NDVIStats } from './types';

// --- Part 1: Image Handling ---

/**
 * Generates a high-precision satellite visual using Unsplash's high-res agricultural photography.
 * Uses increased coordinate precision to ensure nearby farms have unique seeds.
 */
export const generateFallbackImageUrl = (lat: number, lon: number, crop?: string): string => {
  // Use high precision for the seed so nearby farms (differing by small decimals) look unique
  const seed = Math.abs(Math.floor(lat * 10000 + lon * 10000));

  // Agricultural keywords to maintain theme
  const themes = ['satellite+farm', 'aerial+crop', 'agriculture+field', 'vineyard+aerial', 'wheat+field+top+down'];
  const theme = themes[seed % themes.length];

  return `https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1024&sig=${seed}&${theme}`;
};

// Map of high-quality static captures and themed visual anchors
const CROP_IMAGE_MAP: Record<string, string> = {
  "Fresno Almond Orchard #42": "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&q=80&w=1024",
  "Punjab Wheat Field #17": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1024",
  "São Paulo Sugarcane Estate #8": "https://images.unsplash.com/photo-1594614271162-18e388730f77?auto=format&fit=crop&q=80&w=1024",
  "Mekong Delta Rice Paddy": "https://images.unsplash.com/photo-1536630596251-b01c62537265?auto=format&fit=crop&q=80&w=1024",
  "Kerala Spice Valley #5": "https://images.unsplash.com/photo-1599940859674-a7fef639ee15?auto=format&fit=crop&q=80&w=1024",
  "Nashik Grape Estate #12": "https://images.unsplash.com/photo-1506306560945-81206f40776b?auto=format&fit=crop&q=80&w=1024",
  "Apricot Lane Farms (Bio-Diverse)": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=1024",
  "Polyface Regenerative Pastures": "https://images.unsplash.com/photo-1500595046602-cd9ac02fd212?auto=format&fit=crop&q=80&w=1024",
  "Sky High Vegetable Node": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1024",
  "Daylesford Organic Estate": "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=1024",
};

const getImageUrl = (name: string, lat: number, lon: number): string => {
  return CROP_IMAGE_MAP[name] || generateFallbackImageUrl(lat, lon);
};

// --- Part 2: Mock Data ---

export const MOCK_FARMS: FarmData[] = [
  {
    id: 'fresno-almond-42',
    name: "Fresno Almond Orchard #42",
    crop: "ALMOND",
    location: "Fresno, California, USA",
    lat: 36.7378,
    lon: -119.7871,
    sizeHa: 100,
    date: 'June 15, 2025',
    weather: { temp: 38.5, precip: 0.5, humidity: 25, windSpeed: 12, soilMoisture: 18, cloudCover: 15, windChill: 38.5, windDirection: 315 },
    soil: { ph: 7.2, organicMatter: 1.5, nitrogen: 45, phosphorus: 22, potassium: 180 },
    imageUrl: getImageUrl('Fresno Almond Orchard #42', 36.7378, -119.7871),
    maxWindSpeed: 25
  },
  {
    id: 'apricot-lane-avocado',
    name: "Apricot Lane Farms",
    crop: "AVOCADO",
    location: "Moorpark, California, USA",
    lat: 34.4208,
    lon: -118.6926,
    sizeHa: 86,
    date: 'August 22, 2025',
    weather: { temp: 31.0, precip: 0.0, humidity: 30, windSpeed: 14, soilMoisture: 22, cloudCover: 0, windChill: 31.0, windDirection: 180 },
    soil: { ph: 6.8, organicMatter: 5.5, nitrogen: 62, phosphorus: 40, potassium: 250 },
    imageUrl: getImageUrl('Apricot Lane Farms (Bio-Diverse)', 34.4208, -118.6926),
    maxWindSpeed: 40
  },
  {
    id: 'punjab-wheat-17',
    name: 'Punjab Wheat Field #17',
    crop: 'WHEAT',
    location: 'Punjab, India',
    lat: 30.9010,
    lon: 75.8573,
    sizeHa: 45,
    date: 'April 10, 2025',
    weather: { temp: 32.0, precip: 0.0, humidity: 40, windSpeed: 8, soilMoisture: 35, cloudCover: 5, windChill: 32.0, windDirection: 90 },
    soil: { ph: 7.8, organicMatter: 0.9, nitrogen: 35, phosphorus: 15, potassium: 140 },
    imageUrl: getImageUrl('Punjab Wheat Field #17', 30.9010, 75.8573),
    maxWindSpeed: 15
  },
  {
    id: 'kerala-spice-05',
    name: 'Kerala Spice Valley #5',
    crop: 'CARDAMOM',
    location: 'Idukki, Kerala, India',
    lat: 9.9189,
    lon: 77.1025,
    sizeHa: 12,
    date: 'July 05, 2025',
    weather: { temp: 24.5, precip: 15.2, humidity: 88, windSpeed: 10, soilMoisture: 75, cloudCover: 90, windChill: 24.5, windDirection: 210 },
    soil: { ph: 5.8, organicMatter: 4.2, nitrogen: 55, phosphorus: 18, potassium: 210 },
    imageUrl: getImageUrl('Kerala Spice Valley #5', 9.9189, 77.1025),
    maxWindSpeed: 30
  },
  {
    id: 'nashik-grapes-12',
    name: 'Nashik Grape Estate #12',
    crop: 'GRAPES',
    location: 'Nashik, Maharashtra, India',
    lat: 19.9975,
    lon: 73.7898,
    sizeHa: 30,
    date: 'October 12, 2025',
    weather: { temp: 29.0, precip: 2.5, humidity: 55, windSpeed: 12, soilMoisture: 45, cloudCover: 20, windChill: 29.0, windDirection: 270 },
    soil: { ph: 6.8, organicMatter: 2.1, nitrogen: 48, phosphorus: 25, potassium: 195 },
    imageUrl: getImageUrl('Nashik Grape Estate #12', 19.9975, 73.7898),
    maxWindSpeed: 20
  },
  {
    id: 'polyface-pasture',
    name: 'Polyface Regenerative Pastures',
    crop: 'GRASS (PASTURE)',
    location: 'Swoope, Virginia, USA',
    lat: 38.1362,
    lon: -79.2272,
    sizeHa: 220,
    date: 'September 14, 2025',
    weather: { temp: 22.0, precip: 4.8, humidity: 65, windSpeed: 9, soilMoisture: 50, cloudCover: 45, windChill: 22.0, windDirection: 30 },
    soil: { ph: 6.4, organicMatter: 7.2, nitrogen: 85, phosphorus: 55, potassium: 310 },
    imageUrl: getImageUrl('Polyface Regenerative Pastures', 38.1362, -79.2272),
    maxWindSpeed: 25
  },
  {
    id: 'sky-high-veg',
    name: 'Sky High Vegetable Node',
    crop: 'MIXED VEGETABLES',
    location: 'Ancramdale, New York, USA',
    lat: 41.9834,
    lon: -73.6501,
    sizeHa: 40,
    date: 'August 10, 2025',
    weather: { temp: 26.5, precip: 0.0, humidity: 48, windSpeed: 7, soilMoisture: 38, cloudCover: 10, windChill: 26.5, windDirection: 310 },
    soil: { ph: 6.2, organicMatter: 4.8, nitrogen: 70, phosphorus: 32, potassium: 240 },
    imageUrl: getImageUrl('Sky High Vegetable Node', 41.9834, -73.6501),
    maxWindSpeed: 22
  },
  {
    id: 'daylesford-oats',
    name: 'Daylesford Organic Estate',
    crop: 'OATS',
    location: 'Gloucestershire, UK',
    lat: 51.9333,
    lon: -1.6333,
    sizeHa: 950,
    date: 'October 01, 2025',
    weather: { temp: 16.0, precip: 8.5, humidity: 82, windSpeed: 18, soilMoisture: 60, cloudCover: 100, windChill: 14.0, windDirection: 240 },
    soil: { ph: 6.9, organicMatter: 3.5, nitrogen: 52, phosphorus: 28, potassium: 185 },
    imageUrl: getImageUrl('Daylesford Organic Estate', 51.9333, -1.6333),
    maxWindSpeed: 35
  }
];

export const MOCK_FARM = MOCK_FARMS[0];

export const NDVI_STATS: NDVIStats = {
  min: 0.35,
  max: 0.85,
  avg: 0.62,
  stress_threshold: 0.50
};

export const REGIONS: Region[] = [
  {
    id: 'california-central-valley',
    name: 'Central Valley, CA',
    center: { lat: 36.7478, lng: -119.7674 },
    country: 'USA',
    suitableCrops: ['Almond', 'Pistachio', 'Grapes', 'Tomato'],
    season: 'Summer'
  },
  {
    id: 'punjab-india',
    name: 'Punjab, India',
    center: { lat: 30.9010, lng: 75.8573 },
    country: 'India',
    suitableCrops: ['Wheat', 'Rice', 'Cotton', 'Mustard'],
    season: 'Rabi'
  },
  {
    id: 'maharashtra-india',
    name: 'Maharashtra, India',
    center: { lat: 19.9975, lng: 73.7898 },
    country: 'India',
    suitableCrops: ['Grapes', 'Onion', 'Cotton', 'Sugarcane'],
    season: 'Kharif'
  }
];

export const generateNearbyFarms = (region: Region, count: number = 4): FarmData[] => {
  const nearbyFarms: FarmData[] = [];
  for (let i = 0; i < count; i++) {
    const latOffset = (Math.random() * 0.1) - 0.05;
    const lngOffset = (Math.random() * 0.1) - 0.05;
    const lat = region.center.lat + latOffset;
    const lng = region.center.lng + lngOffset;
    const crop = region.suitableCrops[Math.floor(Math.random() * region.suitableCrops.length)];
    const size = Math.floor(Math.random() * 200) + 20;
    const id = `generated-${region.id}-${i}-${Date.now()}`;
    const weather = {
      temp: Math.round(25 + (Math.random() * 10 - 5)),
      precip: Math.round(Math.random() * 10 * 10) / 10,
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round((5 + Math.random() * 10) * 10) / 10,
      soilMoisture: Math.round(30 + Math.random() * 40),
      cloudCover: Math.round(Math.random() * 100),
      windDirection: Math.floor(Math.random() * 360)
    };
    nearbyFarms.push({
      id,
      name: `${region.name.split(',')[0]} ${crop} Farm #${Math.floor(Math.random() * 999)}`,
      location: region.name,
      lat, lon: lng,
      crop, sizeHa: size,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      weather: { ...weather, windChill: weather.temp },
      soil: { ph: 6.5, organicMatter: 2.5, nitrogen: 50, phosphorus: 25, potassium: 150 },
      imageUrl: generateFallbackImageUrl(lat, lng, crop)
    });
  }
  return nearbyFarms;
};

export const generateMockNDVIData = (size: number = 64): number[][] => {
  const grid: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      let value = 0.75 + (Math.random() * 0.15);
      const distFromBottomRight = Math.sqrt(Math.pow(size - x, 2) + Math.pow(size - y, 2));
      if (distFromBottomRight < size * 0.4) {
        const stressFactor = Math.max(0, 1 - (distFromBottomRight / (size * 0.4)));
        value = value - (stressFactor * 0.45);
      }
      row.push(Math.max(-1, Math.min(1, value)));
    }
    grid.push(row);
  }
  return grid;
};
