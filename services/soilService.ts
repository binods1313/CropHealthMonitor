import { SoilData } from '../types';

export const fetchSoilData = async (lat: number, lon: number): Promise<SoilData> => {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Deterministic simulation based on coordinates to keep data consistent for a location
  const seed = Math.abs(lat + lon);
  const random = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  // Simulate pH between 5.5 and 8.0
  const ph = Number((5.5 + random(1) * 2.5).toFixed(1));
  
  // Simulate Organic Matter between 0.5% and 5.0%
  const organicMatter = Number((0.5 + random(2) * 4.5).toFixed(1));

  // Simulate Nutrients (ppm)
  const nitrogen = Math.round(20 + random(3) * 100);    // 20-120 ppm
  const phosphorus = Math.round(10 + random(4) * 50);   // 10-60 ppm
  const potassium = Math.round(80 + random(5) * 220);   // 80-300 ppm

  return {
    ph,
    organicMatter,
    nitrogen,
    phosphorus,
    potassium
  };
};
