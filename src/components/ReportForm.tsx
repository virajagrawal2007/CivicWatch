import React, { useState } from 'react';
import { IssueCategory, IssueStatus } from '../types';
import { CATEGORY_METADATA } from '../utils/mapData';
import CivicMap from './CivicMap';
import { 
  PlusCircle, 
  MapPin, 
  User, 
  Mail, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  CheckSquare, 
  FileText,
  Clock,
  Compass,
  ArrowRight,
  Camera,
  UploadCloud,
  X
} from 'lucide-react';

const PHOTO_PRESETS = [
  {
    id: 'pothole',
    label: 'Open Pothole',
    url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
    category: 'open_potholes'
  },
  {
    id: 'broken_road',
    label: 'Cracked Road',
    url: 'https://images.unsplash.com/photo-1599740831114-1740a31639f1?auto=format&fit=crop&q=80&w=600',
    category: 'broken_roads'
  },
  {
    id: 'streetlight',
    label: 'Dark Streetlight / Pole',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
    category: 'electricity_poles'
  },
  {
    id: 'garbage',
    label: 'Trash & Sanitation',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600',
    category: 'sanitation'
  }
];

interface ReportFormProps {
  currentUser: { name: string; email: string };
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
}

export default function ReportForm({ currentUser, onSubmit, onCancel }: ReportFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IssueCategory>('open_potholes');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [reporterName, setReporterName] = useState(currentUser.name);
  const [reporterEmail, setReporterEmail] = useState(currentUser.email);
  
  // Custom Photo Attachment States
  const [customPhoto, setCustomPhoto] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file (PNG, JPG, JPEG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Coordinates selected from map click
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; neighborhood: string } | null>(null);

  // AI draft preview states
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [aiPreview, setAiPreview] = useState<{
    gravityScore: number;
    gravityJustification: string;
    actionSteps: string[];
    officialRequestDraft: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Capture position clicks from CivicMap
  const handleLocationSelected = (lat: number, lng: number, neighborhood: string) => {
    setCoordinates({
      latitude: lat,
      longitude: lng,
      neighborhood: neighborhood
    });
    // Helpfully suggest a location title if empty
    if (!locationName) {
      setLocationName(`Within ${neighborhood} area`);
    }
  };

  // Preview AI analysis on the fly
  const handleAIPreviewClick = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Please provide a Title and a Description to trigger AI drafting.");
      return;
    }
    setIsDraftingAI(true);
    setAiPreview(null);
    try {
      // We will hit a temporary endpoint or use simulated heuristics
      // To simulate the draft, we can fetch from the server or run a local simulation
      // Let's call a fast endpoint or do high-fidelity generation
      // Since server has a fallback anyway, let's call the server's API mock or actual helper
      
      // Heuristic model simulation for preview
      const descLower = description.toLowerCase();
      let gravity = 5;
      let justification = "AI Preview: Assigned a moderate gravity score pending review.";
      let steps = [
        "1. Dispatch on-site inspector.",
        "2. Formulate public works schedule.",
        "3. Apply physical repairs."
      ];
      
      if (descLower.includes("school") || descLower.includes("child") || descLower.includes("accident") || descLower.includes("crash") || descLower.includes("injury")) {
        gravity = 8;
        justification = "AI Preview: High gravity rating due to active threats in pedestrian school zones, or hazardous collisions reported.";
        steps = [
          "1. Place immediate high-visibility emergency markers.",
          "2. Direct local patrols to guide vehicle slowing.",
          "3. Deploy concrete patching materials within 24 hours."
        ];
      } else if (category === "electricity_poles" && (descLower.includes("dark") || descLower.includes("wire") || descLower.includes("exposure"))) {
        gravity = descLower.includes("wire") ? 9 : 6;
        justification = descLower.includes("wire") 
          ? "AI Preview: Critical high-voltage safety hazard. Exposed wiring has immediate electrocution risk."
          : "AI Preview: Lighting issue increases residential dark zones, elevating risk indices.";
        steps = [
          "1. Isolate grid circuits safely.",
          "2. Replace sensor bulb or damaged wiring terminal.",
          "3. Reactivate photocell light sensors."
        ];
      }

      const requestLetter = `To the City Council Representative,\n\nI am writing to report a public concern: "${title}" located in ${coordinates?.neighborhood || 'our neighborhood'}.\n\nThis infrastructure hazard has been assessed at a gravity safety rating of ${gravity}/10. We request a prompt review and repair within the standard service window.\n\nSincerely,\nConcerned Citizen ${reporterName}`;

      // Delay to simulate computation
      await new Promise(r => setTimeout(r, 1000));
      setAiPreview({
        gravityScore: gravity,
        gravityJustification: justification,
        actionSteps: steps,
        officialRequestDraft: requestLetter
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDraftingAI(false);
    }
  };

  // Submit report to server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinates) {
      alert("Please select a physical location on the interactive map before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        category,
        locationName,
        neighborhood: coordinates.neighborhood,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        reporterName,
        reporterEmail,
        // photo attachment: either customPhoto (base64 or selected preset), or the dynamic default preset for the category!
        photoUrl: customPhoto || (
          category === 'broken_roads' 
            ? "https://images.unsplash.com/photo-1599740831114-1740a31639f1?auto=format&fit=crop&q=80&w=600"
            : category === 'open_potholes'
            ? "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600"
            : category === 'electricity_poles'
            ? "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600"
            : "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600"
        )
      });
    } catch (err) {
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT FORM SIDE */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            File Delhi Community Report
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Describe the public works concern. Fill out details and pinpoint it on the city map.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Title</label>
            <input
              id="report-title-input"
              type="text"
              required
              placeholder="e.g. Broken streetlight on Broad Street intersection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Category</label>
              <select
                id="report-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="open_potholes">Open Pothole</option>
                <option value="broken_roads">Broken / Cracked Road</option>
                <option value="electricity_poles">Electricity Issue / Pole Dark</option>
                <option value="sanitation">Sanitation / Trash Overflow</option>
              </select>
            </div>

            {/* Location Address */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Street Address / Landmark</label>
              <input
                id="report-address-input"
                type="text"
                required
                placeholder="e.g. 520 West End Avenue, outside Pharmacy"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Description</label>
            <textarea
              id="report-description-input"
              rows={4}
              required
              placeholder="Provide exact details of the hazard. How big is it? Is it close to a school/hospital? Does it pose direct risk to cars, elderly walk paths, or bikes? Better details yield more accurate gravity ratings from the AI."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {/* Incident Photograph Option */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-indigo-500" /> Hazard Photo / Attachment
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Upload Box */}
              <div 
                className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20' 
                    : customPhoto 
                    ? 'border-slate-200 dark:border-slate-800' 
                    : 'border-slate-250 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageFile(file);
                }}
              >
                {customPhoto ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden group">
                    <img 
                      src={customPhoto} 
                      alt="Uploaded preview" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600";
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomPhoto('')}
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-1.5 py-4 w-full h-full">
                    <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Drag & Drop or Click to Upload
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPG, JPEG up to 5MB (converts to base64)
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFile(file);
                      }} 
                    />
                  </label>
                )}
              </div>

              {/* Presets Column */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Or select a realistic placeholder
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCustomPhoto(p.url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border transition-all hover:scale-[1.02] cursor-pointer ${
                        customPhoto === p.url 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                          : 'border-slate-150 dark:border-slate-800'
                      }`}
                    >
                      <img 
                        src={p.url} 
                        alt={p.label} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          const target = e.currentTarget;
                          let fallback = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600";
                          if (p.category === 'electricity_poles') {
                            fallback = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600";
                          } else if (p.category === 'sanitation') {
                            fallback = "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600";
                          } else if (p.category === 'broken_roads') {
                            fallback = "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=600";
                          }
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-end p-1.5">
                        <span className="text-[8px] font-bold text-white truncate block w-full text-left">
                          {p.label}
                        </span>
                      </div>
                      {customPhoto === p.url && (
                        <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5">
                          <CheckSquare className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Citizen Bio Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-850">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Citizen Name
              </label>
              <input
                id="report-name-input"
                type="text"
                required
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3" /> Contact Email
              </label>
              <input
                id="report-email-input"
                type="email"
                required
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              id="report-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            
            <div className="flex gap-2">
              <button
                id="report-ai-preview-btn"
                type="button"
                onClick={handleAIPreviewClick}
                disabled={isDraftingAI || !title.trim() || !description.trim()}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                {isDraftingAI ? "Drafting..." : "Preview AI Analysis"}
              </button>

              <button
                id="report-submit-btn"
                type="submit"
                disabled={isSubmitting || !coordinates}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                File Public Report
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* RIGHT SIDE MAP SELECTION & AI PREVIEW PANEL */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Interactive Map positioning */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Set Geotag Pin on Map
          </span>
          <CivicMap
            issues={[]}
            isReportingMode={true}
            tempCoordinates={coordinates}
            onLocationSelected={handleLocationSelected}
          />
        </div>

        {/* Dynamic AI Draft Preview Display */}
        {aiPreview && (
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Sparkles className="w-4.5 h-4.5" />
              <h4 className="font-bold text-xs tracking-tight uppercase text-indigo-300">AI Preview Assessment</h4>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-2.5">
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm font-bold w-10 h-10 flex items-center justify-center flex-shrink-0">
                  {aiPreview.gravityScore}
                </span>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimated Gravity</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                    {aiPreview.gravityJustification}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Suggested Actions</span>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] space-y-1">
                  {aiPreview.actionSteps.map((s, idx) => (
                    <p key={idx} className="text-slate-300 leading-snug">{s}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
