import React, { useState, useRef, useEffect } from 'react';
import { MAP_NEIGHBORHOODS, CATEGORY_METADATA } from '../utils/mapData';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { 
  MapPin, 
  Info, 
  Compass, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  CheckSquare
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const MAP_CENTER_LAT = 28.6139; // Delhi, India center
const MAP_CENTER_LNG = 77.2090; // Delhi, India center
const COORD_SCALE = 0.0035; // Extends nicely to cover key Delhi areas on the 0-100 local grid

export function gridToGps(latGrid: number, lngGrid: number) {
  const lat = MAP_CENTER_LAT - (latGrid - 50) * COORD_SCALE;
  const lng = MAP_CENTER_LNG + (lngGrid - 50) * COORD_SCALE;
  return { lat, lng };
}

export function gpsToGrid(latGps: number, lngGps: number) {
  const latGrid = Math.round((MAP_CENTER_LAT - latGps) / COORD_SCALE + 50);
  const lngGrid = Math.round((lngGps - MAP_CENTER_LNG) / COORD_SCALE + 50);
  return {
    latitude: Math.min(Math.max(latGrid, 0), 100),
    longitude: Math.min(Math.max(lngGrid, 0), 100)
  };
}

function getNeighborhoodForCoords(x: number, y: number): string {
  if (x >= 30 && x <= 70 && y >= 30 && y <= 70) {
    return "Central Delhi";
  }
  if (y < 30) {
    return "North Delhi";
  }
  if (y > 70) {
    return "South Delhi";
  }
  if (x < 30) {
    return "West Delhi";
  }
  return "East Delhi";
}

interface CivicMapProps {
  issues: Issue[];
  selectedIssueId?: string | null;
  onSelectIssue?: (issue: Issue) => void;
  isReportingMode?: boolean;
  tempCoordinates?: { latitude: number; longitude: number; neighborhood: string } | null;
  onLocationSelected?: (lat: number, lng: number, neighborhood: string) => void;
}

export default function CivicMap({
  issues,
  selectedIssueId,
  onSelectIssue,
  isReportingMode = false,
  tempCoordinates,
  onLocationSelected
}: CivicMapProps) {
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Dynamic API Key Fetch state
  const [apiKey, setApiKey] = useState<string>(() => {
    return process.env.GOOGLE_MAPS_PLATFORM_KEY ||
      (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
      (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
      '';
  });

  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      fetch('/api/config/maps-key')
        .then(res => res.json())
        .then(data => {
          if (data.apiKey) {
            setApiKey(data.apiKey);
          }
        })
        .catch(err => console.error("Error fetching maps API key:", err));
    }
  }, [apiKey]);

  const hasValidKey = Boolean(apiKey) && apiKey !== 'YOUR_API_KEY' && apiKey.trim() !== '';

  // Google Map Custom View Controls
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');
  const [zoom, setZoom] = useState<number>(11); // fits the whole Delhi city by default!

  const tempGps = tempCoordinates 
    ? gridToGps(tempCoordinates.latitude, tempCoordinates.longitude)
    : null;

  // Helper to count issues in a neighborhood
  const getNeighborhoodIssueCounts = (neighborhoodName: string) => {
    const nhIssues = issues.filter(i => i.neighborhood === neighborhoodName);
    const active = nhIssues.filter(i => i.status !== 'resolved').length;
    const resolved = nhIssues.filter(i => i.status === 'resolved').length;
    return { total: nhIssues.length, active, resolved };
  };

  // Handle map click in reporting mode
  const handleMapClick = (e: React.MouseEvent<SVGElement>, neighborhoodName: string) => {
    if (!isReportingMode || !onLocationSelected || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to percentage coordinates (0-100) inside our 500x500 box
    const latPercent = Math.round((y / rect.height) * 100);
    const lngPercent = Math.round((x / rect.width) * 100);

    onLocationSelected(latPercent, lngPercent, neighborhoodName);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15
    });
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'reported': return 'bg-amber-500';
      case 'validated': return 'bg-blue-500 border border-white';
      case 'in_progress': return 'bg-purple-500 animate-pulse';
      case 'resolved': return 'bg-emerald-500';
    }
  };

  if (hasValidKey) {
    return (
      <div className="relative w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden shadow-sm flex flex-col items-center">
        <div className="w-full flex flex-col gap-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                {isReportingMode ? "Delhi Interactive Satellite Map" : "Community Map Hub"}
              </h3>
            </div>
            
            {/* Quick Map Type Selector */}
            <div className="flex bg-slate-150 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold border border-slate-250 dark:border-slate-700">
              {(['hybrid', 'satellite', 'roadmap'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMapType(type)}
                  className={`px-2 py-0.5 rounded-md capitalize transition-colors cursor-pointer ${
                    mapType === type
                      ? 'bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            {isReportingMode 
              ? "Positioned at Delhi, India. Zoom in and drag to locate the precise hazard area, then click the map to set your pinpoint."
              : "Explore recorded citizen reports across Delhi. Click markers to review and validate."}
          </p>

          {/* Quick Zoom Presets */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fit Area:</span>
            <button
              type="button"
              onClick={() => setZoom(11)}
              className={`px-2.5 py-0.5 border rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                zoom === 11 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-2xs' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 bg-white dark:bg-slate-900'
              }`}
            >
              Whole Delhi (11)
            </button>
            <button
              type="button"
              onClick={() => setZoom(14)}
              className={`px-2.5 py-0.5 border rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                zoom === 14 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-2xs' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 bg-white dark:bg-slate-900'
              }`}
            >
              District View (14)
            </button>
            <button
              type="button"
              onClick={() => setZoom(17)}
              className={`px-2.5 py-0.5 border rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                zoom === 17 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-2xs' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 bg-white dark:bg-slate-900'
              }`}
            >
              Street Zone (17)
            </button>
          </div>
        </div>

        <div className="relative w-full aspect-square max-w-[420px] bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden shadow-xs">
          <APIProvider apiKey={apiKey} version="weekly">
            <Map
              center={tempGps || { lat: MAP_CENTER_LAT, lng: MAP_CENTER_LNG }}
              zoom={zoom}
              onCameraChanged={(ev) => setZoom(ev.detail.zoom)}
              mapTypeId={mapType}
              mapId="CIVIC_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              onClick={(ev) => {
                if (!isReportingMode || !onLocationSelected || !ev.detail.latLng) return;
                const { lat, lng } = ev.detail.latLng;
                const grid = gpsToGrid(lat, lng);
                const nh = getNeighborhoodForCoords(grid.longitude, grid.latitude);
                onLocationSelected(grid.latitude, grid.longitude, nh);
              }}
            >
              {/* If isReportingMode and we have custom coordinates selected, show pinpoint */}
              {isReportingMode && tempGps && (
                <AdvancedMarker position={tempGps}>
                  <div className="relative group">
                    <div className="absolute -inset-2.5 bg-indigo-500/35 rounded-full animate-ping pointer-events-none"></div>
                    <Pin background="#4f46e5" borderColor="#ffffff" glyphColor="#ffffff" scale={1.2} />
                  </div>
                </AdvancedMarker>
              )}

              {/* If not in reporting mode, render all existing issues as pins */}
              {!isReportingMode && issues.map((issue) => {
                const gps = gridToGps(issue.latitude, issue.longitude);
                const isSelected = selectedIssueId === issue.id;
                
                let pinColor = '#64748b'; // slate
                if (issue.status === 'resolved') {
                  pinColor = '#10b981'; // emerald
                } else {
                  switch (issue.category) {
                    case 'broken_roads': pinColor = '#f59e0b'; break; // amber
                    case 'open_potholes': pinColor = '#ef4444'; break; // red
                    case 'electricity_poles': pinColor = '#eab308'; break; // yellow
                    case 'sanitation': pinColor = '#14b8a6'; break; // teal
                  }
                }

                return (
                  <AdvancedMarker 
                    key={issue.id} 
                    position={gps}
                    onClick={() => onSelectIssue && onSelectIssue(issue)}
                  >
                    <div className={isSelected ? "scale-125 transition-transform" : ""}>
                      <Pin 
                        background={pinColor} 
                        borderColor="#ffffff" 
                        glyphColor="#ffffff" 
                        scale={isSelected ? 1.25 : 1.0} 
                      />
                    </div>
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>

          {/* Prompt overlay if nothing selected in reporting mode */}
          {isReportingMode && !tempCoordinates && (
            <div className="absolute inset-x-4 top-4 bg-slate-900/90 backdrop-blur-xs border border-slate-800 text-white rounded-xl p-3 text-center text-xs pointer-events-none shadow-lg animate-fadeIn">
              <MapPin className="w-5 h-5 mx-auto mb-1 text-indigo-400 animate-bounce" />
              <p className="font-semibold">Tap to set Geotag Location</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Click anywhere on the satellite view above to establish a pinpoint.</p>
            </div>
          )}
        </div>

        {isReportingMode && tempCoordinates && (
          <div className="w-full mt-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 p-2.5 rounded-xl text-xs flex items-start gap-2 border border-indigo-100 dark:border-indigo-900/55 animate-fadeIn">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="font-semibold">Geotag Dropped successfully</p>
              <p className="mt-0.5 leading-relaxed">
                Coordinates saved inside <span className="font-semibold">{tempCoordinates.neighborhood}</span> district (grid ref: [{tempCoordinates.longitude}%, {tempCoordinates.latitude}%]). You can click another spot on the map to change position.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden shadow-sm flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            {isReportingMode ? "Interactive Map: Click to place pinpoint" : "Community Map Hub"}
          </h3>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Potholes
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Roads
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Electricity
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span> Sanitation
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Resolved
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[420px] bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden">
        {/* SVG Core Map */}
        <svg
          id="civic-map-svg"
          ref={svgRef}
          viewBox="0 0 500 500"
          className="w-full h-full select-none"
          onMouseMove={handleMouseMove}
        >
          {/* Neighborhood base regions */}
          {MAP_NEIGHBORHOODS.map((nh) => {
            const counts = getNeighborhoodIssueCounts(nh.name);
            const isHovered = hoveredNeighborhood === nh.id;
            return (
              <path
                key={nh.id}
                id={`nh-path-${nh.id}`}
                d={nh.path}
                className={`transition-colors duration-250 cursor-pointer stroke-[1.5] ${nh.color} ${
                  isHovered ? 'opacity-90' : 'opacity-100'
                }`}
                onMouseEnter={() => setHoveredNeighborhood(nh.id)}
                onMouseLeave={() => setHoveredNeighborhood(null)}
                onClick={(e) => handleMapClick(e, nh.name)}
              />
            );
          })}

          {/* Grid lines for coordinate precision / architectural aesthetic */}
          <g className="stroke-slate-100 dark:stroke-slate-900 stroke-[0.5] pointer-events-none">
            <line x1="100" y1="0" x2="100" y2="500" />
            <line x1="200" y1="0" x2="200" y2="500" />
            <line x1="300" y1="0" x2="300" y2="500" />
            <line x1="400" y1="0" x2="400" y2="500" />
            <line x1="0" y1="100" x2="500" y2="100" />
            <line x1="0" y1="200" x2="500" y2="200" />
            <line x1="0" y1="300" x2="500" y2="300" />
            <line x1="0" y1="400" x2="500" y2="400" />
          </g>

          {/* District Labels */}
          {MAP_NEIGHBORHOODS.map((nh) => (
            <text
              key={`label-${nh.id}`}
              id={`nh-label-${nh.id}`}
              x={nh.center.x}
              y={nh.center.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-medium fill-slate-400 dark:fill-slate-500 pointer-events-none tracking-wider uppercase select-none opacity-60"
            >
              {nh.name.split(' ')[0]}
            </text>
          ))}

          {/* Render Active Issue Pins */}
          {!isReportingMode &&
            issues.map((issue) => {
              // Convert 0-100 back to 500x500 coordinates
              const cx = (issue.longitude / 100) * 500;
              const cy = (issue.latitude / 100) * 500;
              const isSelected = selectedIssueId === issue.id;
              
              // Get color representation
              let pinColor = 'fill-slate-500';
              if (issue.status === 'resolved') {
                pinColor = 'fill-emerald-500 stroke-emerald-600';
              } else {
                switch (issue.category) {
                  case 'broken_roads': pinColor = 'fill-amber-500 stroke-amber-600'; break;
                  case 'open_potholes': pinColor = 'fill-red-500 stroke-red-600'; break;
                  case 'electricity_poles': pinColor = 'fill-yellow-500 stroke-yellow-600'; break;
                  case 'sanitation': pinColor = 'fill-teal-500 stroke-teal-600'; break;
                }
              }

              return (
                <g
                  key={issue.id}
                  id={`issue-pin-g-${issue.id}`}
                  className="cursor-pointer transition-transform duration-200 hover:scale-125"
                  onClick={() => onSelectIssue && onSelectIssue(issue)}
                >
                  {/* Selected halo */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="16"
                      className="fill-indigo-500/25 stroke-indigo-500 stroke-1 animate-ping"
                    />
                  )}
                  {/* Outer circle shadow */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "10" : "7.5"}
                    className={`${pinColor} stroke-2 stroke-white dark:stroke-slate-950`}
                  />
                  {/* Inner indicator dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "3.5" : "2.5"}
                    className="fill-white"
                  />
                </g>
              );
            })}

          {/* Render Temp pin during creation */}
          {isReportingMode && tempCoordinates && (
            <g id="temp-reporting-pin">
              <circle
                cx={(tempCoordinates.longitude / 100) * 500}
                cy={(tempCoordinates.latitude / 100) * 500}
                r="18"
                className="fill-indigo-500/20 stroke-indigo-500 stroke-1 animate-pulse"
              />
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                transform={`translate(${(tempCoordinates.longitude / 100) * 500 - 12}, ${(tempCoordinates.latitude / 100) * 500 - 22}) scale(1)`}
                className="fill-indigo-600 dark:fill-indigo-400 stroke-white stroke-1"
              />
            </g>
          )}
        </svg>

        {/* Floating instructions overlay for reporting */}
        {isReportingMode && !tempCoordinates && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center text-white pointer-events-none">
            <MapPin className="w-8 h-8 mb-2 animate-bounce text-indigo-400" />
            <p className="font-semibold text-sm">Where is the issue located?</p>
            <p className="text-xs text-slate-200 mt-1 max-w-[240px]">
              Tap anywhere on the city map districts above to drop a precise location pin.
            </p>
          </div>
        )}

        {/* Dynamic Hover Tooltip inside SVG Area */}
        {hoveredNeighborhood && !isReportingMode && (
          <div
            id="map-neighborhood-tooltip"
            className="absolute z-15 bg-slate-900/95 text-white border border-slate-800 rounded-lg p-2.5 text-xs shadow-xl pointer-events-none transition-all duration-75"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            {(() => {
              const nh = MAP_NEIGHBORHOODS.find(n => n.id === hoveredNeighborhood);
              if (!nh) return null;
              const counts = getNeighborhoodIssueCounts(nh.name);
              return (
                <div>
                  <p className="font-semibold text-slate-100 border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    {nh.name}
                  </p>
                  <div className="space-y-0.5 text-slate-300">
                    <p className="flex justify-between gap-6">Active Concerns: <span className="font-medium text-amber-400">{counts.active}</span></p>
                    <p className="flex justify-between gap-6">Resolved: <span className="font-medium text-emerald-400">{counts.resolved}</span></p>
                    <p className="flex justify-between gap-6">Total Logged: <span className="font-medium text-slate-300">{counts.total}</span></p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {isReportingMode && tempCoordinates && (
        <div className="w-full mt-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 p-2.5 rounded-xl text-xs flex items-start gap-2 border border-indigo-100 dark:border-indigo-900/55 animate-fadeIn">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Pin Established Successfully</p>
            <p className="mt-0.5">
              Pinned in <span className="font-semibold">{tempCoordinates.neighborhood}</span> at grid coordinates [X: {tempCoordinates.longitude}%, Y: {tempCoordinates.latitude}%]. You can click elsewhere to reposition.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
