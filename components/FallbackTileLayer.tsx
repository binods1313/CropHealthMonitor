import React from 'react';
import { TileLayer } from 'react-leaflet';
import L from 'leaflet';

interface FallbackTileLayerProps {
  primaryUrl: string;
  fallbackUrl?: string;
  attribution: string;
  [key: string]: any;
}

const FallbackTileLayer: React.FC<FallbackTileLayerProps> = ({ 
  primaryUrl, 
  fallbackUrl, 
  attribution, 
  ...props 
}) => {
  const [currentUrl, setCurrentUrl] = React.useState(primaryUrl);

  // If a fallback URL is provided, create an error handler
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);

  React.useEffect(() => {
    if (tileLayerRef.current && fallbackUrl) {
      const tileLayer = tileLayerRef.current;
      
      const handleError = () => {
        // Switch to fallback URL if primary fails
        setCurrentUrl(fallbackUrl);
        tileLayer.off('tileerror', handleError);
      };

      tileLayer.on('tileerror', handleError);

      return () => {
        tileLayer.off('tileerror', handleError);
      };
    }
  }, [fallbackUrl]);

  return (
    <TileLayer
      ref={tileLayerRef}
      url={currentUrl}
      attribution={attribution}
      {...props}
    />
  );
};

export default FallbackTileLayer;