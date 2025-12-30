// NASA API Service for Crop Intelligence
import { GeoNewsItem } from '../components/EarthBrief';

// Function to fetch NASA crop data using NASA POWER API
export const fetchNASACropData = async (lat: number, lng: number) => {
  try {
    // NASA POWER API for agricultural data
    const response = await fetch(
      `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lng}&latitude=${lat}&start=20240101&end=20241231&format=JSON`
    );
    
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process and analyze crop suitability
    return analyzeCropConditions(data.properties.parameter);
  } catch (error) {
    console.error('NASA API error:', error);
    // Return mock data in case of error
    return {
      avgTemp: 25.0,
      precipitation: 500,
      solarRad: 20.0,
      suitability: 75,
      recommendation: 'Moderate conditions, consider irrigation'
    };
  }
};

// Helper function to analyze crop conditions
export const analyzeCropConditions = (params: any) => {
  const temps = Object.values(params.T2M || {});
  const precip = Object.values(params.PRECTOTCORR || {});
  const solar = Object.values(params.ALLSKY_SFC_SW_DWN || {});

  const avgTemp = temps.length > 0 
    ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length 
    : 25.0;
  const totalPrecip = precip.length > 0 
    ? precip.reduce((a: number, b: number) => a + b, 0) 
    : 500;
  const avgSolar = solar.length > 0 
    ? solar.reduce((a: number, b: number) => a + b, 0) / solar.length 
    : 20.0;

  // Simplified suitability calculation
  let suitability = 50;
  if (avgTemp >= 20 && avgTemp <= 30) suitability += 20;
  if (totalPrecip >= 500 && totalPrecip <= 1500) suitability += 20;
  if (avgSolar >= 15) suitability += 10;

  return {
    avgTemp: avgTemp.toFixed(1),
    precipitation: totalPrecip.toFixed(0),
    solarRad: avgSolar.toFixed(1),
    suitability: Math.min(suitability, 100),
    recommendation: suitability > 70
      ? 'Excellent conditions for crop cultivation'
      : suitability > 50
      ? 'Moderate conditions, consider irrigation'
      : 'Challenging conditions, crop selection critical'
  };
};

// Function to fetch NASA EONET events
export const fetchNASAEvents = async () => {
  try {
    const response = await fetch(
      'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires,floods,droughts&status=open&limit=50'
    );
    
    if (!response.ok) {
      throw new Error(`NASA EONET error: ${response.status}`);
    }
    
    const data = await response.json();

    const mappedEvents = data.events
      .filter((event: any) => event.geometry && event.geometry.length > 0)
      .map((event: any) => ({
        id: event.id,
        title: event.title,
        category: event.categories[0].title,
        date: event.geometry[0].date,
        lat: event.geometry[0].coordinates[1],
        lng: event.geometry[0].coordinates[0],
        source: 'NASA EONET',
        isNASA: true
      }));

    return mappedEvents;
  } catch (error) {
    console.error('NASA EONET error:', error);
    return []; // Return empty array in case of error
  }
};