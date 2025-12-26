
import { WeatherData, ForecastDay } from '../types';
import { fetchWithFallback } from '../utils/apiFallback';

// NOTE: In a production environment, this should be set via build-time environment variables (e.g., process.env.OPENWEATHER_API_KEY)
// For this demo, if no key is present, we fallback to a realistic simulation based on the location.
const API_KEY = '44e44041829168eddaeeeab19d340de6'; 

// Calculate Wind Chill using the formula:
// Twc = 13.12 + 0.6215Ta - 11.37v^0.16 + 0.3965Ta*v^0.16
// where Ta is air temp in Celsius and v is wind speed in km/h.
// Valid for Temperatures <= 10°C and Wind Speed >= 4.8 km/h.
// Outside these ranges, we default to the air temperature.
const calculateWindChill = (temp: number, windSpeedMs: number): number => {
  const windSpeedKmh = windSpeedMs * 3.6;
  
  // Strict Wind Chill definition applies mainly to cold weather
  if (temp <= 10 && windSpeedKmh >= 4.8) {
    const wc = 13.12 + (0.6215 * temp) - (11.37 * Math.pow(windSpeedKmh, 0.16)) + (0.3965 * temp * Math.pow(windSpeedKmh, 0.16));
    return Math.round(wc);
  }
  
  // If not applicable (e.g. hot weather), return the actual temp
  return temp;
};

export const fetchRealTimeWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  // Define the API call function
  const apiCall = async (): Promise<WeatherData> => {
    // If no API key is provided, throw an error to trigger fallback
    if (!API_KEY) {
      throw new Error("No OpenWeatherMap API key found");
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();
    const temp = Math.round(data.main.temp);
    const windSpeed = Math.round(data.wind.speed); // m/s
    const windDirection = data.wind.deg || 0; // Degrees
    const cloudCover = data.clouds ? data.clouds.all : 0; // Percentage

    return {
      temp,
      humidity: data.main.humidity,
      // OpenWeatherMap puts rain volume in rain['1h'] or rain['3h'] if it exists
      precip: data.rain ? (data.rain['1h'] || 0) : 0,
      windSpeed,
      windDirection,
      cloudCover,
      // Attempt to find soil moisture in API response (Agro API/OneCall), otherwise simulate
      soilMoisture: (data.main && data.main.soil_moisture)
        ? data.main.soil_moisture
        : simulateSoilMoisture(lat, lon),
      windChill: calculateWindChill(temp, windSpeed)
    };
  };

  // Use fallback mechanism
  return fetchWithFallback(
    apiCall,
    simulateWeather(lat, lon),
    "Failed to fetch real-time weather from OpenWeatherMap API"
  );
};

export const fetchForecast = async (lat: number, lon: number): Promise<ForecastDay[]> => {
  // Define the API call function
  const apiCall = async (): Promise<ForecastDay[]> => {
    if (!API_KEY) {
      throw new Error("No OpenWeatherMap API key found");
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Forecast API returned ${response.status}`);
    }

    const data = await response.json();
    const forecast: ForecastDay[] = [];
    const processedDates = new Set<string>();
    const today = new Date().toISOString().split('T')[0];

    // Filter list to get distinct days (approximating daily forecast from 3h steps)
    for (const item of data.list) {
      const datePart = item.dt_txt.split(' ')[0];

      // Skip today, we want the next 3 days
      if (datePart === today) continue;

      // We prefer the entry close to noon (12:00:00)
      const isNoon = item.dt_txt.includes("12:00:00");

      if (!processedDates.has(datePart)) {
        // If it's noon, or if we haven't seen this date yet (fallback to first entry of the day), take it
        if (isNoon) {
            const precip = item.rain ? (item.rain['3h'] || 0) : 0;
            forecast.push({
                day: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
                temp: Math.round(item.main.temp),
                condition: item.weather[0].main as any,
                precip
            });
            processedDates.add(datePart);
        }
      }

      if (forecast.length === 3) break;
    }

    // Fallback if we didn't find exactly 3 noon entries (e.g. data ends)
    if (forecast.length < 3) {
        throw new Error("Insufficient forecast data from API");
    }

    return forecast;
  };

  // Use fallback mechanism
  return fetchWithFallback(
    apiCall,
    simulateForecast(lat, lon),
    "Failed to fetch forecast from OpenWeatherMap API"
  );
};

const simulateSoilMoisture = (lat: number, lon: number): number => {
    // Generate a number between 20 and 80 based on location
    const seed = Math.abs(lat + lon);
    const random = Math.sin(seed * 123) * 10000;
    const normalized = random - Math.floor(random);
    return Math.round(20 + (normalized * 60));
};

// Generates consistent "random" weather based on coordinates and current time
const simulateWeather = (lat: number, lon: number): WeatherData => {
  const now = new Date();
  const seed = Math.abs(lat + lon) + now.getHours();
  
  const random = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  const isNorthernHemisphere = lat > 0;
  const month = now.getMonth();
  const absLat = Math.abs(lat);

  // Determine season (approximate)
  const isSummer = (isNorthernHemisphere && (month > 4 && month < 9)) || 
                   (!isNorthernHemisphere && (month > 10 || month < 2));
  
  // Base temperature calculation
  let baseTemp = 0;
  if (absLat < 23.5) {
    baseTemp = 28 + (random(1) * 5); 
  } else if (absLat < 50) {
    baseTemp = isSummer ? 25 : 5;
    baseTemp -= ((absLat - 23.5) / 26.5) * 10; 
  } else {
    baseTemp = isSummer ? 15 : -10;
    baseTemp -= ((absLat - 50) / 40) * 15;
  }

  // Add random variance
  const temp = Math.round(baseTemp + (random(2) * 10 - 5));

  // Wind speed simulation
  let baseWind = 3;
  if (absLat > 40) baseWind += 3;
  
  const windSpeed = Math.round(baseWind + (random(3) * 10));
  const windDirection = Math.floor(Math.random() * 360);
  const cloudCover = Math.round(random(7) * 100);

  return {
    temp,
    humidity: Math.round(40 + (random(4) * 50)),
    precip: random(5) > 0.7 ? Number((random(6) * 10).toFixed(1)) : 0,
    windSpeed,
    windDirection,
    cloudCover,
    soilMoisture: simulateSoilMoisture(lat, lon),
    windChill: calculateWindChill(temp, windSpeed)
  };
};

const simulateForecast = (lat: number, lon: number): ForecastDay[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const forecast: ForecastDay[] = [];
    const seed = Math.abs(lat + lon);

    // Reuse similar temp logic for consistency
    const isNorthernHemisphere = lat > 0;
    const month = new Date().getMonth();
    const isSummer = (isNorthernHemisphere && (month > 4 && month < 9)) || 
                     (!isNorthernHemisphere && (month > 10 || month < 2));
    
    let baseTemp = 20;
    if (Math.abs(lat) > 40) baseTemp = isSummer ? 20 : 5;
    if (Math.abs(lat) < 23) baseTemp = 30;

    const conditions: ForecastDay['condition'][] = ['Clear', 'Clouds', 'Rain', 'Clear', 'Clouds'];

    for (let i = 1; i <= 3; i++) {
        const nextDayIndex = (today + i) % 7;
        const pseudoRandom = Math.sin(seed * i) * 10000;
        const r = pseudoRandom - Math.floor(pseudoRandom);
        
        const precip = r > 0.6 ? Math.round(r * 15 * 10) / 10 : 0;

        forecast.push({
            day: days[nextDayIndex],
            temp: Math.round(baseTemp + (r * 8 - 4)),
            condition: conditions[Math.floor(r * conditions.length)],
            precip
        });
    }
    return forecast;
};