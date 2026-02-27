'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CensusMapPopup } from './census-map-popup';
import type { CensusBuilding, CensusUnit, CensusZone } from '@/types/database';

// Fix Leaflet default icon issue in webpack/Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

interface CensusMapInnerProps {
  buildings: CensusBuilding[];
  unitsByBuildingObj: Record<string, CensusUnit[]>;
  zone?: CensusZone;
}

function getBuildingColor(building: CensusBuilding): string {
  if (building.interested_count > 0) return '#22c55e'; // green
  if (building.contacted_count === building.total_units && building.total_units > 0)
    return '#3b82f6'; // blue
  if (building.contacted_count > 0) return '#f97316'; // orange
  return '#6b7280'; // gray
}

function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// Dark Matter tiles for dark mode
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Default center for Cornaredo (MI)
const DEFAULT_CENTER: [number, number] = [45.498, 9.024];

export default function CensusMapInner({
  buildings,
  unitsByBuildingObj,
}: CensusMapInnerProps) {
  // Calculate map center from building coordinates
  const center = useMemo(() => {
    const withCoords = buildings.filter((b) => b.lat && b.lng);
    if (withCoords.length === 0) return DEFAULT_CENTER;

    const avgLat =
      withCoords.reduce((sum, b) => sum + b.lat!, 0) / withCoords.length;
    const avgLng =
      withCoords.reduce((sum, b) => sum + b.lng!, 0) / withCoords.length;
    return [avgLat, avgLng] as [number, number];
  }, [buildings]);

  const buildingsWithCoords = buildings.filter((b) => b.lat && b.lng);

  if (buildingsWithCoords.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border bg-muted/50">
        <p className="text-muted-foreground">
          Nessun edificio geocodificato. Sincronizza i dati catastali.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[500px] overflow-hidden rounded-lg border md:h-[600px]">
      <MapContainer
        center={center}
        zoom={15}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />

        {buildingsWithCoords.map((building) => {
          const color = getBuildingColor(building);
          const icon = createColoredIcon(color);
          const units = unitsByBuildingObj[building.id] ?? [];

          return (
            <Marker
              key={building.id}
              position={[building.lat!, building.lng!]}
              icon={icon}
            >
              <Popup maxWidth={300}>
                <CensusMapPopup building={building} units={units} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
