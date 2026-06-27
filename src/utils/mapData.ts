import { NeighborhoodData } from '../types';

export const MAP_NEIGHBORHOODS: NeighborhoodData[] = [
  {
    id: "nh_central",
    name: "Central Delhi",
    // Coordinates inside a 500x500 viewport
    path: "M 150,150 L 350,150 L 350,350 L 150,350 Z",
    color: "fill-slate-100 hover:fill-slate-200 stroke-slate-400 dark:fill-slate-800 dark:hover:fill-slate-700 dark:stroke-slate-600",
    center: { x: 250, y: 250 }
  },
  {
    id: "nh_north",
    name: "North Delhi",
    path: "M 0,0 L 500,0 L 350,150 L 150,150 L 0,150 Z",
    color: "fill-blue-50/70 hover:fill-blue-100/70 stroke-blue-200 dark:fill-blue-950/20 dark:hover:fill-blue-900/30 dark:stroke-blue-800",
    center: { x: 250, y: 75 }
  },
  {
    id: "nh_east",
    name: "East Delhi",
    path: "M 500,0 L 500,500 L 350,350 L 350,150 Z",
    color: "fill-emerald-50/70 hover:fill-emerald-100/70 stroke-emerald-200 dark:fill-emerald-950/20 dark:hover:fill-emerald-900/30 dark:stroke-emerald-800",
    center: { x: 425, y: 250 }
  },
  {
    id: "nh_south",
    name: "South Delhi",
    path: "M 150,350 L 350,350 L 500,500 L 0,500 Z",
    color: "fill-amber-50/70 hover:fill-amber-100/70 stroke-amber-200 dark:fill-amber-950/20 dark:hover:fill-amber-900/30 dark:stroke-amber-800",
    center: { x: 250, y: 425 }
  },
  {
    id: "nh_west",
    name: "West Delhi",
    path: "M 0,0 L 150,150 L 150,350 L 0,500 Z",
    color: "fill-indigo-50/70 hover:fill-indigo-100/70 stroke-indigo-200 dark:fill-indigo-950/20 dark:hover:fill-indigo-900/30 dark:stroke-indigo-800",
    center: { x: 75, y: 250 }
  }
];

export const CATEGORY_METADATA = {
  broken_roads: {
    id: 'broken_roads',
    label: 'Broken Roads',
    icon: 'CornerUpRight',
    description: 'Cracked paving, collapsed asphalt, structural sidewalk failures, missing curbs.',
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  open_potholes: {
    id: 'open_potholes',
    label: 'Open Potholes',
    icon: 'CircleAlert',
    description: 'Deep road potholes, crumbling surfaces, tire and rim damage hazards.',
    color: 'text-red-600',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeBg: 'bg-red-100 text-red-800 border-red-200'
  },
  electricity_poles: {
    id: 'electricity_poles',
    label: 'Electricity Issues',
    icon: 'Zap',
    description: 'Broken streetlights, missing lighting poles, exposed live cabling, transformer sparks.',
    color: 'text-yellow-600',
    bgLight: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  sanitation: {
    id: 'sanitation',
    label: 'Sanitation Concerns',
    icon: 'Trash2',
    description: 'Overflowing dumpsters, garbage pileups, sewage leaks, clogged rain storm drains.',
    color: 'text-teal-600',
    bgLight: 'bg-teal-50',
    borderColor: 'border-teal-200',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200'
  }
};
