import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

interface MapZoomControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
}

const MapZoomControl = ({ position = 'topright' }: MapZoomControlProps) => {
  const map = useMap();

  // Position the zoom control appropriately
  useEffect(() => {
    // Remove default zoom control if it exists
    const defaultZoomControl = document.querySelector('.leaflet-control-zoom');
    if (defaultZoomControl) {
      defaultZoomControl.remove();
    }

    // Add custom zoom control positioning
    const leafletControlClasses = {
      'topleft': 'leaflet-top leaflet-left',
      'topright': 'leaflet-top leaflet-right',
      'bottomleft': 'leaflet-bottom leaflet-left',
      'bottomright': 'leaflet-bottom leaflet-right'
    };

    // Get the main leaflet control container
    const controlContainer = map.getContainer().querySelector('.leaflet-control-container');

    if (controlContainer) {
      // Create a custom zoom control container
      const zoomControl = document.createElement('div');
      zoomControl.className = `leaflet-control-zoom leaflet-bar ${leafletControlClasses[position]}`;
      zoomControl.style.position = 'absolute';
      zoomControl.style.zIndex = '1000';
      zoomControl.style.visibility = 'visible';

      // Create zoom in button
      const zoomInButton = document.createElement('a');
      zoomInButton.innerHTML = '+';
      zoomInButton.className = 'leaflet-control-zoom-in bg-white text-stone-800 hover:bg-stone-100 border border-stone-200 rounded-t-lg w-8 h-8 flex items-center justify-center font-black text-lg leading-none cursor-pointer';
      zoomInButton.href = '#';
      zoomInButton.title = 'Zoom in';
      zoomInButton.role = 'button';
      zoomInButton.ariaLabel = 'Zoom in';
      zoomInButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        map.zoomIn();
      };

      // Create zoom out button
      const zoomOutButton = document.createElement('a');
      zoomOutButton.innerHTML = '-';
      zoomOutButton.className = 'leaflet-control-zoom-out bg-white text-stone-800 hover:bg-stone-100 border-l border-r border-b border-stone-200 rounded-b-lg w-8 h-8 flex items-center justify-center font-black text-lg leading-none cursor-pointer';
      zoomOutButton.href = '#';
      zoomOutButton.title = 'Zoom out';
      zoomOutButton.role = 'button';
      zoomOutButton.ariaLabel = 'Zoom out';
      zoomOutButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        map.zoomOut();
      };

      zoomControl.appendChild(zoomInButton);
      zoomControl.appendChild(zoomOutButton);
      controlContainer.appendChild(zoomControl);
    }

    // Clean up on unmount
    return () => {
      const zoomControl = document.querySelector(`.${leafletControlClasses[position]}`);
      if (zoomControl) {
        zoomControl.remove();
      }
    };
  }, [map, position]);

  return null;
};

export default MapZoomControl;