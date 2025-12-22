import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with bundlers
// Using CDN URLs for marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Tashkent center coordinates
const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];
const DEFAULT_ZOOM = 13;

interface LocationPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

/**
 * DraggableMarker component handles marker dragging
 */
interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}

const DraggableMarker: React.FC<DraggableMarkerProps> = ({ position, onPositionChange }) => {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          onPositionChange(lat, lng);
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
};


/**
 * MapClickHandler handles clicks on the map to set marker position
 */
interface MapClickHandlerProps {
  onLocationChange: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onLocationChange }) => {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/**
 * LocationPicker component displays an interactive map for location selection
 * Requirements: 4.1, 4.2
 * - 4.1: Display interactive map centered on Tashkent
 * - 4.2: Allow dragging pin to exact location
 */
const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, onLocationChange }) => {
  const position: [number, number] = [lat, lng];

  const handlePositionChange = useCallback(
    (newLat: number, newLng: number) => {
      onLocationChange(newLat, newLng);
    },
    [onLocationChange]
  );

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={position[0] === 0 && position[1] === 0 ? TASHKENT_CENTER : position}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker
          position={position}
          onPositionChange={handlePositionChange}
        />
        <MapClickHandler onLocationChange={handlePositionChange} />
      </MapContainer>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Нажмите на карту или перетащите маркер для выбора адреса
      </p>
    </div>
  );
};

export default LocationPicker;
