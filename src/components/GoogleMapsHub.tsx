import React, { useState, useEffect, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Square, 
  RefreshCw, 
  CheckSquare, 
  X, 
  ArrowRight,
  Info,
  Sliders,
  Sparkles,
  Search,
  ThumbsUp,
  TrendingUp,
  Map as MapIcon,
  Lock
} from 'lucide-react';

// Coordinates mapping utilities between our relative 0-100 grid and Delhi, India GPS coords
const MAP_CENTER_LAT = 28.6139; // New Delhi center
const MAP_CENTER_LNG = 77.2090; // New Delhi center
const COORD_SCALE = 0.0035; // Spread size factor to nicely fit the whole Delhi metropolitan area on a 0-100 local grid

export function gridToGps(latGrid: number, lngGrid: number) {
  // SVG coordinates: Y goes top-to-bottom. GPS latitude goes bottom-to-top.
  // To keep directions consistent, we invert the Y axis transformation.
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

interface GoogleMapsHubProps {
  issues: Issue[];
  currentUser: { name: string; email: string; role: string };
  onRefreshIssues: () => void;
  onSelectIssue: (issue: Issue) => void;
  onNavigateToTab: (tab: 'dashboard' | 'issues' | 'report' | 'leaderboard') => void;
}

export default function GoogleMapsHub({ 
  issues, 
  currentUser, 
  onRefreshIssues, 
  onSelectIssue,
  onNavigateToTab
}: GoogleMapsHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<'map' | 'transit'>('map');
  const [selectedPinIssue, setSelectedPinIssue] = useState<Issue | null>(null);

  // Dynamic API Key state
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
        .catch(err => console.error("Error fetching maps API key in hub:", err));
    }
  }, [apiKey]);

  const hasValidKey = Boolean(apiKey) && apiKey !== 'YOUR_API_KEY' && apiKey.trim() !== '';
  
  // Custom Map View Controls (Dynamic Satellite Map of Delhi)
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');
  const [zoom, setZoom] = useState<number>(11); // default zoom 11 covers the whole city of Delhi
  const [transitZoom, setTransitZoom] = useState<number>(11); // default transit zoom
  
  // Driving Simulation State
  const [simState, setSimState] = useState<'idle' | 'driving' | 'paused' | 'arrived'>('idle');
  const [selectedRoute, setSelectedRoute] = useState<'route_a' | 'route_b' | 'route_c'>('route_a');
  const [currentProgress, setCurrentProgress] = useState(0); // 0 to 100%
  const [carPosition, setCarPosition] = useState<google.maps.LatLngLiteral>(gridToGps(50, 50));
  const [activePrompt, setActivePrompt] = useState<{ issue: Issue; distance: number } | null>(null);
  const [potholesPriority, setPotholesPriority] = useState<Issue[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reference for the marker to attach InfoWindow
  const [markerRef, marker] = useAdvancedMarkerRef();

  // Load and sort priority queue based on validations count (complaints)
  useEffect(() => {
    // Only potholes and sanitation issues are prioritized here
    let filtered = issues.filter(i => i.category === 'open_potholes' || i.category === 'sanitation');
    
    // If citizen, filter to only show their own reported issues in the sidebar
    if (currentUser.role === 'citizen') {
      filtered = filtered.filter(i => i.reporterEmail === currentUser.email);
    }
    
    // Sort descending by number of validations (complaints count)
    const sorted = [...filtered].sort((a, b) => b.validations.length - a.validations.length);
    setPotholesPriority(sorted);
  }, [issues, currentUser]);

  // Handle toast timeout
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Trigger setup instructions if valid key is missing
  if (!hasValidKey) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-8 max-w-2xl mx-auto shadow-xs text-center space-y-6 my-10">
        <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center animate-bounce">
          <MapIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Google Maps Integration Required</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-lg mx-auto">
            To display potholes on Google Maps and simulate real-time transit navigation with crowd-sourced validations, you must provide your Google Maps Platform API key.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left space-y-4 max-w-md mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Setup Instructions</p>
          <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold flex items-center justify-center flex-shrink-0">1</span>
              <span>
                <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold">Get a Google Maps API Key</a> (ensure Maps JavaScript API is enabled).
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold flex items-center justify-center flex-shrink-0">2</span>
              <span>
                Open <strong>Settings</strong> (⚙️ gear icon, top-right corner of AI Studio)
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold flex items-center justify-center flex-shrink-0">3</span>
              <span>
                Select <strong>Secrets</strong> and add a new secret named <code>GOOGLE_MAPS_PLATFORM_KEY</code> with your API key.
              </span>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          The app will automatically rebuild and establish connection immediately once the key is saved.
        </p>
      </div>
    );
  }

  // Pre-defined routes for our Driving Simulator
  // Each route has a list of coordinates (X, Y in relative grid units) and descriptions
  const ROUTES_CONFIG = {
    route_a: {
      name: "Ring Road Commute (Connaught Place to South Ext)",
      desc: "Simulates driving through inner and outer ring road junctions, passing near reported potholes.",
      path: [
        { x: 50, y: 50 }, // Connaught Place (Center)
        { x: 45, y: 55 },
        { x: 40, y: 65 }, 
        { x: 35, y: 72 }, // Passes near south district
        { x: 52, y: 80 },
        { x: 65, y: 85 }
      ],
      color: "#f59e0b"
    },
    route_b: {
      name: "Karol Bagh Commercial Alley Sweep",
      desc: "Commute route passing near Karol Bagh market alleyways where sanitation overflows are reported.",
      path: [
        { x: 30, y: 40 },
        { x: 35, y: 45 },
        { x: 40, y: 52 }, // Passes near Central Market (40, 52)
        { x: 45, y: 58 },
        { x: 50, y: 65 }
      ],
      color: "#10b981"
    },
    route_c: {
      name: "Chanakyapuri & Diplomatic Enclave Run",
      desc: "Complete sweep passing through central diplomatic districts to inspect reported hazards.",
      path: [
        { x: 20, y: 70 }, 
        { x: 35, y: 65 },
        { x: 42, y: 58 }, 
        { x: 50, y: 50 }, // Connaught Place junction
        { x: 68, y: 35 }  
      ],
      color: "#ef4444"
    }
  };

  // Run Route Driving Simulator Logic
  const startSimulation = () => {
    setSimState('driving');
    setCurrentProgress(0);
    setActivePrompt(null);
    setTransitZoom(16); // Precise zoom-in during driving simulation
  };

  const stopSimulation = () => {
    setSimState('idle');
    setCurrentProgress(0);
    setActivePrompt(null);
    setTransitZoom(11); // Reset to full city view
  };

  // Simulation Interval Tick
  useEffect(() => {
    if (simState !== 'driving') return;

    const route = ROUTES_CONFIG[selectedRoute];
    const interval = setInterval(() => {
      setCurrentProgress(prev => {
        const next = prev + 2;
        if (next >= 100) {
          setSimState('arrived');
          setTransitZoom(11); // Reset to full city view
          clearInterval(interval);
          setToastMessage("🚗 Simulated Trip Completed successfully!");
          return 100;
        }

        // Interpolate current position coordinate on route path
        const segmentCount = route.path.length - 1;
        const segmentProgress = next / 100 * segmentCount;
        const segmentIndex = Math.floor(segmentProgress);
        const segmentRatio = segmentProgress - segmentIndex;

        const startNode = route.path[segmentIndex];
        const endNode = route.path[segmentIndex + 1];

        if (startNode && endNode) {
          const currentX = startNode.x + (endNode.x - startNode.x) * segmentRatio;
          const currentY = startNode.y + (endNode.y - startNode.y) * segmentRatio;
          const currentGps = gridToGps(currentY, currentX);
          setCarPosition(currentGps);

          // Check proximity to any reported active pothole or sanitation problem
          // Limit to potholes and sanitation problems as described in the user request
          const drivingIncidents = issues.filter(i => 
            i.status !== 'resolved' && 
            (i.category === 'open_potholes' || i.category === 'sanitation')
          );

          for (const incident of drivingIncidents) {
            const incGps = gridToGps(incident.latitude, incident.longitude);
            // Calculate a simplified distance on the 0-100 coordinate grid
            const dx = incident.longitude - currentX;
            const dy = incident.latitude - currentY;
            const distanceGrid = Math.sqrt(dx*dx + dy*dy);

            // If within ~5.5 grid units (approx 100 meters), pause and trigger the prompt
            if (distanceGrid < 5.5) {
              setSimState('paused');
              setActivePrompt({
                issue: incident,
                distance: Math.round(distanceGrid * 20) // Simulated meters
              });
              clearInterval(interval);
              break;
            }
          }
        }

        return next;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [simState, selectedRoute, issues]);

  // Handle validating a pothole from Google Maps navigation prompt
  const handleValidateFromPrompt = async (isActuallyThere: boolean) => {
    if (!activePrompt) return;
    const issueId = activePrompt.issue.id;

    if (isActuallyThere) {
      // Validate/Add complaint
      try {
        const response = await fetch(`/api/issues/${issueId}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        });
        if (response.ok) {
          setToastMessage(`✅ Validation logged! Priority bumped for "${activePrompt.issue.title}".`);
          onRefreshIssues();
        } else {
          // Already validated or other API error
          const data = await response.json();
          setToastMessage(data.error || "You have already verified this issue.");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Flag or note that it might be resolved
      try {
        const response = await fetch(`/api/issues/${issueId}/flag`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        });
        if (response.ok) {
          setToastMessage(`⚠️ Logged feedback: Citizen noted this hazard might be resolved.`);
          onRefreshIssues();
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Dismiss prompt and resume transit
    setActivePrompt(null);
    setSimState('driving');
  };

  // Convert current simulated route to GPS path coordinates for polyline rendering
  const getSimulatedRouteCoordinates = () => {
    const route = ROUTES_CONFIG[selectedRoute];
    return route.path.map(pt => gridToGps(pt.y, pt.x));
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Sub Tabs Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
            Google Maps Integration Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize incidents on real-world Maps and test crowd-sourced validation prompts.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            id="gmaps-subtab-map"
            onClick={() => { setActiveSubTab('map'); stopSimulation(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'map'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-350'
            }`}
          >
            <MapIcon className="w-4 h-4" /> Live Incident Map
          </button>
          <button
            id="gmaps-subtab-transit"
            onClick={() => setActiveSubTab('transit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'transit'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-350'
            }`}
          >
            <Navigation className="w-4 h-4" /> Transit Simulator
          </button>
        </div>
      </div>

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border border-slate-800 flex items-center gap-2 animate-slideIn">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAP PANEL - Large Left Section */}
        <div className="lg:col-span-8 space-y-4">
          
          {activeSubTab === 'map' ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-3xl p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-900">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapIcon className="w-4 h-4 text-indigo-500" /> Delhi Satellite Map Hub
                  </span>
                  <p className="text-xs text-slate-500">Fit whole city with seamless satellite/hybrid rendering and precise zoom levels.</p>
                </div>
                
                {/* Control Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Map Type Selector */}
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800 text-xs">
                    {(['hybrid', 'satellite', 'roadmap', 'terrain'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setMapType(t)}
                        className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-colors cursor-pointer ${
                          mapType === t
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => setZoom(11)}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        zoom === 11
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title="Fit Whole City View"
                    >
                      City (11)
                    </button>
                    <button
                      onClick={() => setZoom(13)}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        zoom === 13
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title="District View"
                    >
                      District (13)
                    </button>
                    <button
                      onClick={() => setZoom(16)}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        zoom === 16
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      title="Street View"
                    >
                      Street (16)
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Canvas Sized with explicit height to prevent collapse */}
              <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-850 relative">
                <APIProvider apiKey={apiKey} version="weekly">
                  <Map
                    center={{ lat: MAP_CENTER_LAT, lng: MAP_CENTER_LNG }}
                    zoom={zoom}
                    onCameraChanged={(ev) => setZoom(ev.detail.zoom)}
                    mapTypeId={mapType}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {/* Render advanced marker pins for all reported issues */}
                    {issues.map((issue) => {
                      const gps = gridToGps(issue.latitude, issue.longitude);
                      
                      let pinColor = '#94a3b8'; // Grey default
                      if (issue.status === 'resolved') {
                        pinColor = '#10b981'; // emerald
                      } else {
                        switch (issue.category) {
                          case 'open_potholes': pinColor = '#ef4444'; break; // red
                          case 'broken_roads': pinColor = '#f59e0b'; break; // amber
                          case 'electricity_poles': pinColor = '#eab308'; break; // yellow
                          case 'sanitation': pinColor = '#14b8a6'; break; // teal
                        }
                      }

                      return (
                        <AdvancedMarker
                          key={issue.id}
                          position={gps}
                          onClick={() => setSelectedPinIssue(issue)}
                        >
                          <Pin background={pinColor} borderColor="#fff" glyphColor="#fff" />
                        </AdvancedMarker>
                      );
                    })}

                    {/* Show InfoWindow when a pin is selected */}
                    {selectedPinIssue && (() => {
                      const hasDetailsAccess = currentUser.role !== 'citizen' || selectedPinIssue.reporterEmail === currentUser.email;
                      return (
                        <InfoWindow
                          position={gridToGps(selectedPinIssue.latitude, selectedPinIssue.longitude)}
                          onCloseClick={() => setSelectedPinIssue(null)}
                        >
                          <div className="p-1 max-w-[220px] text-slate-800 space-y-2">
                            <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-indigo-600">
                              <span>{selectedPinIssue.category.replace('_', ' ')}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500">{selectedPinIssue.neighborhood}</span>
                            </div>
                            
                            {hasDetailsAccess ? (
                              <>
                                <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{selectedPinIssue.title}</h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{selectedPinIssue.description}</p>
                                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700">{selectedPinIssue.validations.length} complaints</span>
                                  <button
                                    onClick={() => {
                                      onSelectIssue(selectedPinIssue);
                                      onNavigateToTab('issues');
                                    }}
                                    className="text-indigo-600 hover:underline font-extrabold flex items-center gap-0.5 cursor-pointer"
                                  >
                                    Inspect Details <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <h4 className="font-extrabold text-xs text-slate-400 leading-snug italic flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Resident Report (Restricted)
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                  Full details are restricted to the reporting resident and municipal heads.
                                </p>
                                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-400">{selectedPinIssue.validations.length} complaints</span>
                                  <span className="text-slate-400 font-bold flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> Locked
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </InfoWindow>
                      );
                    })()}
                  </Map>
                </APIProvider>
              </div>

              {/* Map Guide details */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {[
                  { label: "Potholes", color: "bg-red-500" },
                  { label: "Broken Roads", color: "bg-amber-500" },
                  { label: "Electricity Poles", color: "bg-yellow-500" },
                  { label: "Sanitation Leaks", color: "bg-teal-500" },
                  { label: "Resolved", color: "bg-emerald-500" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-350">
                    <span className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`}></span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            
            // TRANSIT NAVIGATION SIMULATOR SCREEN
            <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-3xl p-5 shadow-xs space-y-4">
              
              {/* Simulator Controls header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      Google Maps Navigation API Simulator
                    </span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Select Travel Route</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {simState === 'idle' || simState === 'arrived' ? (
                      <button
                        id="sim-start-btn"
                        onClick={startSimulation}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" /> Start Driving
                      </button>
                    ) : (
                      <button
                        id="sim-stop-btn"
                        onClick={stopSimulation}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-white" /> Stop driving
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(ROUTES_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      disabled={simState === 'driving' || simState === 'paused'}
                      onClick={() => setSelectedRoute(key as any)}
                      className={`p-3 text-left rounded-xl border transition-all text-xs flex flex-col justify-between ${
                        selectedRoute === key
                          ? 'border-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'
                      } ${simState === 'driving' || simState === 'paused' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{config.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{config.desc}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-850 flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }}></span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Selected Path</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE SIMULATION STATUS PANEL */}
              {(simState === 'driving' || simState === 'paused' || simState === 'arrived') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-indigo-50/40 dark:bg-indigo-950/25 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Simulated Driver Status</span>
                    <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-center md:justify-start gap-1.5">
                      {simState === 'driving' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
                      {simState === 'paused' && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                      {simState === 'arrived' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                      <span className="capitalize">{simState}</span>
                    </p>
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Distance Travelled</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1 max-w-[150px] mx-auto md:mx-0">
                      <div className="bg-indigo-600 h-full transition-all" style={{ width: `${currentProgress}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Current GPS Grid</span>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-350">
                      {carPosition.lat.toFixed(5)}° N, {carPosition.lng.toFixed(5)}° E
                    </p>
                  </div>
                </div>
              )}

              {/* MAP VISUALIZATION CANVAS */}
              <div className="w-full h-[380px] rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-850 relative">
                <APIProvider apiKey={apiKey} version="weekly">
                  <Map
                    center={simState === 'driving' || simState === 'paused' ? carPosition : { lat: MAP_CENTER_LAT, lng: MAP_CENTER_LNG }}
                    zoom={transitZoom}
                    onCameraChanged={(ev) => setTransitZoom(ev.detail.zoom)}
                    mapTypeId={mapType}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {/* Render advanced marker pins for potholes */}
                    {issues.filter(i => i.category === 'open_potholes' || i.category === 'sanitation').map((issue) => {
                      const gps = gridToGps(issue.latitude, issue.longitude);
                      const isResolved = issue.status === 'resolved';

                      return (
                        <AdvancedMarker key={issue.id} position={gps}>
                          <Pin 
                            background={isResolved ? '#10b981' : issue.category === 'open_potholes' ? '#ef4444' : '#14b8a6'} 
                            borderColor="#fff" 
                            glyphColor="#fff" 
                          />
                        </AdvancedMarker>
                      );
                    })}

                    {/* Render simulated Car Navigation position */}
                    {(simState === 'driving' || simState === 'paused') && (
                      <AdvancedMarker position={carPosition}>
                        <div className="w-9 h-9 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg transform -rotate-45 relative animate-pulse">
                          <Navigation className="w-4.5 h-4.5 text-white transform rotate-45" />
                        </div>
                      </AdvancedMarker>
                    )}
                  </Map>
                </APIProvider>

                {/* HIGH FIDELITY GOOGLE MAPS NAVIGATION PROMPT */}
                {activePrompt && (
                  <div className="absolute inset-x-4 bottom-4 z-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-slideIn">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl h-fit">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Google Maps Navigation Prompt</p>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                            Road Hazard: {activePrompt.issue.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Google Maps detected that you are passing a reported <strong className="text-red-500">{activePrompt.issue.category.replace('_', ' ')}</strong> at <span className="font-semibold">{activePrompt.issue.locationName}</span>. 
                            Please verify the hazard's active presence:
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400 font-bold px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900/50 uppercase tracking-wide">
                        {activePrompt.distance}m Ahead
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        id="prompt-pothole-yes"
                        onClick={() => handleValidateFromPrompt(true)}
                        className="py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <ThumbsUp className="w-4 h-4 text-emerald-400" /> Yes, Still There
                      </button>
                      <button
                        id="prompt-pothole-no"
                        onClick={() => handleValidateFromPrompt(false)}
                        className="py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-950 dark:text-slate-350 dark:border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4 text-red-500" /> No, It's Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* PRIORITY REPAIR QUEUE - Left/Right Section */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-3xl p-5 shadow-xs space-y-4">
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> priority Repair Queue
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Potholes & sanitation issues prioritized in real-time based on traffic and total validations/complaints received.
              </p>
            </div>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {potholesPriority.map((item, idx) => {
                const validationsCount = item.validations.length;
                
                // Determine priority level based on count as requested
                // "then the potholes with most traffic(most complaints) will be put on priority to be fixed"
                let priorityLabel = "Normal Priority";
                let priorityColor = "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-450";
                
                if (validationsCount >= 5) {
                  priorityLabel = "CRITICAL PRIORITY";
                  priorityColor = "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/50";
                } else if (validationsCount >= 2) {
                  priorityLabel = "HIGH PRIORITY";
                  priorityColor = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/50";
                }

                return (
                  <div
                    key={item.id}
                    id={`priority-queue-item-${item.id}`}
                    onClick={() => {
                      onSelectIssue(item);
                      onNavigateToTab('issues');
                    }}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-2xl transition-all cursor-pointer space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-indigo-500 uppercase">
                          Rank #{idx + 1}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityColor}`}>
                          {priorityLabel}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-100 leading-snug line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/55 dark:border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">
                        Location: <strong className="text-slate-600 dark:text-slate-350">{item.neighborhood}</strong>
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1 bg-indigo-50/70 dark:bg-indigo-950/50 px-2 py-1 rounded-md border border-indigo-100/40">
                        <CheckSquare className="w-3 h-3" /> {validationsCount} complaints
                      </span>
                    </div>
                  </div>
                );
              })}

              {potholesPriority.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No active potholes or sanitation problems reported.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
