export type WindUnit = 'm/s' | 'km/h' | 'mph' | 'knots';

export const convertWindSpeed = (speed: number, from: string, to: string): number => {
  if (!speed && speed !== 0) return 0;
  if (from === to) return speed;

  // 1. Convert input to m/s
  let speedMs = speed;
  switch (from) {
    case 'km/h': 
      speedMs = speed / 3.6; 
      break;
    case 'mph': 
      speedMs = speed * 0.44704; 
      break;
    case 'knots': 
      speedMs = speed * 0.514444; 
      break;
    case 'm/s': 
    default: 
      break;
  }

  // 2. Convert m/s to output
  let result = speedMs;
  switch (to) {
    case 'km/h': 
      result = speedMs * 3.6; 
      break;
    case 'mph': 
      result = speedMs * 2.23694; 
      break;
    case 'knots': 
      result = speedMs * 1.94384; 
      break;
    case 'm/s': 
    default: 
      break;
  }

  // Round to 1 decimal place for display
  return Number(result.toFixed(1));
};

export const formatWindSpeed = (speed: number, unit: string): string => {
  return `${speed} ${unit}`;
};
