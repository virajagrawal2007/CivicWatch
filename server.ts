import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing with reasonable limit
app.use(express.json({ limit: '10mb' }));

// Set up dedicated data folder (like src is for code)
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const VOUCHERS_FILE = path.join(DB_DIR, 'vouchers.json');
const PREFERENCES_FILE = path.join(DB_DIR, 'user_preferences.json');

interface RedeemedVoucher {
  id: string;
  voucherId: string;
  title: string;
  cost: number;
  provider: string;
  code: string;
  redeemedAt: string;
  userEmail: string;
}

// Interface mirroring our src/types.ts
interface Comment {
  id: string;
  userName: string;
  userEmail: string;
  text: string;
  createdAt: string;
}

interface TimelineEvent {
  id: string;
  status: string;
  title: string;
  description: string;
  updatedBy: string;
  createdAt: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: 'broken_roads' | 'open_potholes' | 'electricity_poles' | 'sanitation';
  status: 'reported' | 'validated' | 'in_progress' | 'resolved';
  locationName: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  reporterName: string;
  reporterEmail: string;
  createdAt: string;
  updatedAt: string;
  validations: string[];
  flags: string[];
  gravityScore: number;
  gravityJustification: string;
  actionSteps: string[];
  officialRequestDraft: string;
  comments: Comment[];
  timeline: TimelineEvent[];
  photoUrl?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

// Ensure database directory and file exist with mock data
const SEED_ISSUES: Issue[] = [
  {
    id: "iss_1",
    title: "Dangerous Deep Potholes near Connaught Place Outer Circle",
    description: "There are multiple deep waterlogged potholes in the middle of Connaught Place Outer Circle right outside Block F. Cars have to swerve dangerously into other lanes to avoid them, causing massive traffic pile-ups during rush hours. This is a severe safety risk for two-wheelers and pedestrians crossing the Outer Circle.",
    category: "open_potholes",
    status: "validated",
    locationName: "Outer Circle Road, near Block F, Connaught Place",
    neighborhood: "Central Delhi",
    latitude: 42,
    longitude: 35,
    reporterName: "Sarah Jenkins",
    reporterEmail: "sarah.j@civic.org",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["alex.rivera@civic.org", "maria.g@gmail.com", "tom.b@civic.org", "amit.v@civic.in"],
    flags: [],
    gravityScore: 8,
    gravityJustification: "The potholes are deep (6+ inches) and located directly on a major commercial ring road. Swerving into adjacent high-speed traffic lanes during high-density evening rush hours poses an immediate collision hazard for commuters and local shoppers.",
    actionSteps: [
      "1. Dispatch a traffic inspector to place emergency safety barriers and warnings.",
      "2. Issue a slow-speed commuter advisory for Connaught Place Outer Circle.",
      "3. Queue a priority maintenance crew to clear loose asphalt, apply hot mix patch, and steamroll flat.",
      "4. Recenter and repaint the pedestrian crossing guidelines adjacent to the repair."
    ],
    officialRequestDraft: "To the New Delhi Municipal Council (NDMC),\n\nI am writing to formally report a hazardous road condition posing an immediate threat to pedestrian and vehicular safety. Multiple severe potholes, measuring approximately 15 inches wide and 6 inches deep, have formed in the driving lane of Connaught Place Outer Circle, directly outside Block F.\n\nDuring peak hours, drivers and two-wheelers are forced to make sudden lane changes into oncoming traffic to bypass this defect. Given its proximity to an active shopping arcade and metro entrance, this is an unacceptable danger.\n\nWe request immediate emergency cones to mark the potholes, followed by a permanent hot-asphalt repair. Thank you for your prompt attention to the safety of our central business district.\n\nSincerely,\nConcerned Citizens of Connaught Place",
    photoUrl: "https://images.unsplash.com/photo-1599740831114-1740a31639f1?auto=format&fit=crop&q=80&w=600",
    comments: [
      {
        id: "c_1",
        userName: "Alex Rivera",
        userEmail: "alex.rivera@civic.org",
        text: "I almost popped my front left tire here yesterday evening. It's really hard to see in the rain! Validated.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "c_2",
        userName: "Maria Gonzalez",
        userEmail: "maria.g@gmail.com",
        text: "My kids cross here every day. This needs fixing ASAP before an accident happens.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_1",
        status: "reported",
        title: "Issue Reported",
        description: "Sarah Jenkins reported deep potholes near Connaught Place Outer Circle.",
        updatedBy: "Sarah Jenkins",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_2",
        status: "validated",
        title: "Community Validated",
        description: "The issue has reached multiple verifications and is now an official community concern.",
        updatedBy: "System Core",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_2",
    title: "Non-Functional Streetlights on Chandni Chowk Marg",
    description: "The heritage-style street light poles along Chandni Chowk Marg have been completely dark for over two weeks. The entire shopping walkway and bazaar junction is pitch black after sunset, making it unsafe for shoppers, traders, and tourists. There has been an increase in pickpocketing near the dark metro corner.",
    category: "electricity_poles",
    status: "reported",
    locationName: "Chandni Chowk Main Road, Near Old Delhi Railway Station",
    neighborhood: "West Delhi",
    latitude: 25,
    longitude: 70,
    reporterName: "James Carter",
    reporterEmail: "james.c@gmail.com",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["sarah.j@civic.org", "priya.s@gmail.com"],
    flags: [],
    gravityScore: 5,
    gravityJustification: "Moderate safety risk. While it does not represent an immediate physical hazard, complete darkness at a major busy market walk substantially decreases pedestrian safety and increases opportunities for pickpocketing or other crimes in a highly dense historic market zone.",
    actionSteps: [
      "1. Schedule municipal electrical utility team for bulb and fuse inspection.",
      "2. Test photoelectric control cell on the heritage poles to determine if replacement of sensor is required.",
      "3. If necessary, swap current legacy lamps with energy-efficient LED fixtures.",
      "4. Check local wiring junction box at the corner of Chandni Chowk Metro for circuit faults."
    ],
    officialRequestDraft: "To the Municipal Utility Department,\n\nI am writing to report non-functioning heritage-style streetlight poles located along Chandni Chowk Main Road near the Old Delhi station walkway. These lights have been inactive for approximately 14 days, plunging a major pedestrian bazaar and metro entrance into complete darkness.\n\nPedestrians, including tourists and local shopkeepers who lock up late, have expressed significant safety concerns regarding this complete lack of visibility. Furthermore, dark streets are known to correlate with increased safety risks.\n\nWe request a technician visit the poles to replace the lamps or repair the underlying electrical circuit. Thank you.\n\nSincerely,\nChandni Chowk Vyapar Mandal (Traders Association)",
    photoUrl: "https://images.unsplash.com/photo-1508515053963-70c7cc39dfb5?auto=format&fit=crop&q=80&w=600",
    comments: [
      {
        id: "c_3",
        userName: "Sarah Jenkins",
        userEmail: "sarah.j@civic.org",
        text: "Agreed. Walking around that corner at night is absolutely terrifying right now. Let's get this validated quickly.",
        createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_3",
        status: "reported",
        title: "Issue Reported",
        description: "James Carter submitted a report regarding the dark Chandni Chowk streetlights.",
        updatedBy: "James Carter",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_3",
    title: "Overflowing Garbage & Blocked Drains near Karol Bagh Market",
    description: "The public garbage dumpsters in the alleyway behind Gaffar Market are completely overflowing. Stray cattle and dogs are ripping bags open, spilling organic waste. The storm-water drains are blocked with plastic bags, causing foul-smelling stagnant water to puddle across the walkway.",
    category: "sanitation",
    status: "in_progress",
    locationName: "Gaffar Market Alley, Karol Bagh, New Delhi",
    neighborhood: "Central Delhi",
    latitude: 52,
    longitude: 40,
    reporterName: "Elena Rostova",
    reporterEmail: "elena.r@restaurant-assoc.org",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["james.c@gmail.com", "sarah.j@civic.org", "maria.g@gmail.com", "alex.rivera@civic.org", "sunita.d@outlook.com"],
    flags: [],
    gravityScore: 7,
    gravityJustification: "High sanitation risk. Overflowing organic waste combined with stagnant sewage water forms a breeding ground for vectors and disease, directly behind active commercial food stalls. Blocked drains risk flooding during sudden heavy rains.",
    actionSteps: [
      "1. Alert Municipal Waste Management to dispatch an extra dump sweep truck.",
      "2. Send sanitation workers with high-pressure hoses to wash down the alley.",
      "3. Dispatch a vacuum sewer truck to clear out the plastic waste blocking the storm water drain.",
      "4. Issue regulatory notices to commercial vendors regarding proper trash containment."
    ],
    officialRequestDraft: "To the Board of Health and Sanitation Department,\n\nWe are filing a joint citizen complaint regarding an ongoing sanitary hazard behind Gaffar Market in Karol Bagh. Public refuse bins are overflowing constantly, and loose waste has now completely blocked the storm-water culvert, creating a pool of stagnant, putrid run-off water.\n\nThis attracts pests and stray animals directly behind active commercial food establishments, presenting an immediate violation of sanitary standards. We urgently request:\n1. An immediate garbage clearing and area power-wash.\n2. Clearance of the storm drainage system to let the wastewater drain.\n3. Better enforcement or larger bins for commercial waste in this alley.\n\nThank you for taking care of our public health,\nKarol Bagh Traders & Citizen Association",
    photoUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=600",
    comments: [
      {
        id: "c_4",
        userName: "Alex Rivera",
        userEmail: "alex.rivera@civic.org",
        text: "The smell is creeping into the outdoor dining areas. This is affecting local livelihoods. Glad this got assigned.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "c_5",
        userName: "City Inspector Davis",
        userEmail: "m.davis@citygov.org",
        text: "Commercial clean-up crew dispatched. Drainage contractors scheduled for storm drain vacuuming tomorrow at 8 AM.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_4",
        status: "reported",
        title: "Sanitation Issue Logged",
        description: "Elena Rostova reported waste overflow near Gaffar Market.",
        updatedBy: "Elena Rostova",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_5",
        status: "validated",
        title: "Community Verified",
        description: "Issue passed community validations and was moved to municipal prioritization.",
        updatedBy: "System Core",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_6",
        status: "in_progress",
        title: "Contractor Assigned",
        description: "Sanitation and drainage crews have been assigned and sent to site.",
        updatedBy: "City Inspector Davis",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_4",
    title: "Damaged Pedestrian Walkway near India Gate Hexagon",
    description: "The stone pavement tiles have completely cracked open and buckled due to heavy tourist footfall and vehicle movement. A section of the retaining curb is completely crumbled, allowing dust and mud to spill onto the walkway during rains. This is a severe trip hazard for elderly visitors and wheelchair users visiting India Gate.",
    category: "broken_roads",
    status: "resolved",
    locationName: "Kartavya Path Access Walkway, India Gate",
    neighborhood: "East Delhi",
    latitude: 80,
    longitude: 20,
    reporterName: "Arthur Pendelton",
    reporterEmail: "arthur.p@gmail.com",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["sarah.j@civic.org", "maria.g@gmail.com", "elena.r@restaurant-assoc.org", "rohit.s@yahoo.com"],
    flags: [],
    gravityScore: 6,
    gravityJustification: "Significant accessibility risk. The broken stone pavement acts as a trip hazard and completely blocks access for wheelchair users or strollers, forcing visitors to walk on the busy vehicular road around the India Gate roundabout.",
    actionSteps: [
      "1. Secure the site with safety cones and clear detour markers.",
      "2. Excavate the damaged pavement sections and compact the sub-base.",
      "3. Place new durable reinforced sandstone paving tiles.",
      "4. Repair and rebuild the crumbling stone retaining curb structure."
    ],
    officialRequestDraft: "To the NDMC Engineering and Public Safety Division,\n\nI am writing to draw your urgent attention to the buckled sandstone pedestrian pavement along the main visitor access pathway leading to India Gate. The paving tiles have fractured and lifted by several inches, causing severe unevenness and total failure of the retaining curb.\n\nThousands of tourists, including children, elderly citizens, and disabled visitors, navigate this path daily. Walking is extremely unsafe, forcing some onto the busy vehicular ring road. This is a significant safety liability.\n\nWe request immediate rehabilitation of these paving tiles to restore safe and accessible public pathways around our national landmark.\n\nSincerely,\nDelhi Heritage & Citizen Forum",
    photoUrl: "https://images.unsplash.com/photo-1616075737466-834893b80b7e?auto=format&fit=crop&q=80&w=600",
    resolutionNotes: "Sandstone tiles fully excavated, sub-base compacted, and pavement laid fresh. Retaining curb rebuilt and inspected for accessibility.",
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: "c_6",
        userName: "Arthur Pendelton",
        userEmail: "arthur.p@gmail.com",
        text: "Thank you to the NDMC crews! The walkway is beautifully restored and completely level now. Safe for families and wheelchairs alike.",
        createdAt: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_7",
        status: "reported",
        title: "Accessibility Concern Logged",
        description: "Arthur Pendelton reported broken pavement near India Gate.",
        updatedBy: "Arthur Pendelton",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_8",
        status: "validated",
        title: "Community Verified",
        description: "Community validated the issue, identifying high wheelchair risk.",
        updatedBy: "System Core",
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_9",
        status: "in_progress",
        title: "Rehabilitation Commenced",
        description: "Contractors set up frames and compacting equipment.",
        updatedBy: "City Sidewalk Dept",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_10",
        status: "resolved",
        title: "Pavement Restored Successfully",
        description: "Sandstone tiles were laid fresh and inspected for pedestrian safe crossing.",
        updatedBy: "City Sidewalk Dept",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_5",
    title: "Exposed Live Wiring hanging near Saket Metro Gate 2",
    description: "An electrical junction box next to the bus queue shelter near Saket Metro Station Gate 2 has its metal door completely ripped off. Live copper wiring bundle is dangling loose and exposed, right at children's eye level. During waterlogging in monsoons, this poses an extreme electrocution hazard for hundreds of daily metro commuters.",
    category: "electricity_poles",
    status: "in_progress",
    locationName: "Saket Metro Gate 2, Press Enclave Road, Saket",
    neighborhood: "South Delhi",
    latitude: 75,
    longitude: 60,
    reporterName: "Priya Sharma",
    reporterEmail: "priya.s@gmail.com",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["alex.rivera@civic.org", "amit.v@civic.in", "rahul.g@civic.in"],
    flags: [],
    gravityScore: 9,
    gravityJustification: "Critical hazard. Loose electrical wiring exposed in a high-density transit walkway next to a steel bus shelter. High probability of lethal electrocution or spark ignition, especially with monsoon moisture.",
    actionSteps: [
      "1. Alert BSES Rajdhani Power limited control room to cut power feed to the specific street unit.",
      "2. Dispatch an emergency electrical responder to secure and tape the wire terminals.",
      "3. Replace the vandalized junction box door with a high-durability locking metal panel.",
      "4. Conduct grounding safety audit of adjacent public lighting poles."
    ],
    officialRequestDraft: "To BSES Rajdhani Power Limited & SDMC Works Division,\n\nI am raising a high-priority safety alert regarding a severely hazardous public installation at the Saket Metro Gate 2 commuter walk. A distribution junction box adjacent to the main shelter has been left completely open with exposed live wires.\n\nGiven the dense foot traffic and the onset of summer rains, this constitutes an immediate threat to human life. We request immediate emergency dispatch to isolate the circuit and mount a secure, waterproof locking door on the unit.\n\nSincerely,\nSaket Residents and Commuters Association",
    photoUrl: "https://images.unsplash.com/photo-1558486012-817176f84c6d?auto=format&fit=crop&q=80&w=600",
    comments: [
      {
        id: "c_7",
        userName: "Amit Verma",
        userEmail: "amit.v@civic.in",
        text: "This is criminally dangerous. I have verified it and also called the power company hotline. They promised to send a lineman.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_11",
        status: "reported",
        title: "Hazard Reported",
        description: "Priya Sharma raised a high-priority alert regarding exposed live wires.",
        updatedBy: "Priya Sharma",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_12",
        status: "validated",
        title: "Community Verified",
        description: "Verified by 3 community contributors. Urgent status assigned.",
        updatedBy: "System Core",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_13",
        status: "in_progress",
        title: "Emergency Isolation",
        description: "BSES emergency unit dispatched to isolate the live terminals temporarily.",
        updatedBy: "BSES Electrical Division",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_6",
    title: "Deep Pothole Crater at Ring Road intersection, Lajpat Nagar",
    description: "A large, crater-like pothole has appeared at the busy Lajpat Nagar Ring Road intersection, right under the flyover. The depression is over 8 inches deep and has caused multiple motorbikes to slip, resulting in minor injuries. Traffic is constantly backing up as buses must stop and navigate around the hazard.",
    category: "open_potholes",
    status: "reported",
    locationName: "Ring Road Interchange, under Lajpat Nagar Flyover",
    neighborhood: "East Delhi",
    latitude: 60,
    longitude: 85,
    reporterName: "Rohit Singh",
    reporterEmail: "rohit.s@yahoo.com",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["maria.g@gmail.com"],
    flags: [],
    gravityScore: 7,
    gravityJustification: "High vehicular impact risk. Located on a high-speed arterial flyover bypass road. Pothole depth of 8 inches is sufficient to fracture suspension components or throw two-wheeler riders off balance, leading to critical road casualties.",
    actionSteps: [
      "1. Alert traffic police to place fluorescent traffic barrels around the crater.",
      "2. Schedule overnight cold-mix asphalt patching to prevent high-traffic disruption.",
      "3. Inspect underground water lines to check if a leaky water main caused the soil erosion underneath."
    ],
    officialRequestDraft: "To the Public Works Department (PWD) Delhi,\n\nI am writing to report a highly dangerous road collapse (crater) on the main Ring Road under the Lajpat Nagar Flyover. Multiple two-wheelers have slipped here in the last 24 hours alone.\n\nAs this is one of Delhi's busiest transit corridors, leaving this crater open invites a fatal accident. We request immediate temporary filling followed by a proper structural repair.\n\nSincerely,\nRohit Singh, Lajpat Nagar Resident",
    photoUrl: "https://images.unsplash.com/photo-1615569675312-7008984955b3?auto=format&fit=crop&q=80&w=600",
    comments: [
      {
        id: "c_8",
        userName: "Maria Gonzalez",
        userEmail: "maria.g@gmail.com",
        text: "Witnessed a scooter rider lose balance here today. This needs to be barricaded immediately. Added validation.",
        createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_14",
        status: "reported",
        title: "Pothole Crater Reported",
        description: "Rohit Singh reported an 8-inch deep crater on the busy Lajpat Nagar interchange.",
        updatedBy: "Rohit Singh",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_7",
    title: "Clogged Drainage Canal & Garbage Accumulation, Nehru Place Flyover",
    description: "The main rainwater outlet channel next to the Nehru Place IT Market flyover ramp is completely choked with solid commercial packaging and plastic waste. A large pool of dark, stinking water has flooded the service lane. This is severely blocking the pedestrian entrance to the computer market and breeding clouds of mosquitoes.",
    category: "sanitation",
    status: "validated",
    locationName: "Nehru Place Service Lane, near Flyover Ramp",
    neighborhood: "South Delhi",
    latitude: 85,
    longitude: 50,
    reporterName: "Sunita Devi",
    reporterEmail: "sunita.d@outlook.com",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["amit.v@civic.in", "rahul.g@civic.in", "priya.s@gmail.com"],
    flags: [],
    gravityScore: 6,
    gravityJustification: "Environmental health risk. Stagnant industrial/commercial water run-off in a high-density IT business park promotes dengue and malaria vector breeding. Service lane flooding forces pedestrians to walk on the high-speed flyover ramp.",
    actionSteps: [
      "1. Dispatch a municipal drain clearance squad to extract solid plastic waste blockage.",
      "2. Apply chemical larvicides on the standing water pool to suppress mosquito breeding.",
      "3. Re-grade the concrete lip of the channel to ensure smooth gravity drainage flow.",
      "4. Place public signboards warning nearby electronic shops against dumping styrofoam and cardboard packaging."
    ],
    officialRequestDraft: "To the South Delhi Municipal Corporation (SDMC) Sanitation Wing,\n\nWe represent the local traders and visitors of the Nehru Place computer market. The stormwater outlet along the service lane has been completely blocked by plastic and industrial refuse, causing putrid black water to pool on the road.\n\nThis is creating a health hazard and severely impacting foot traffic to local businesses. We request an immediate sanitation sweep and de-clogging of the drainage pipes before the water enters commercial basement premises.\n\nSincerely,\nNehru Place Traders Association",
    photoUrl: "https://images.unsplash.com/photo-1605600611280-1465af201f97?auto=format&fit=crop&q=80&w=600",
    comments: [
      {
        id: "c_9",
        userName: "Rahul Gupta",
        userEmail: "rahul.g@civic.in",
        text: "The smell is unbearable during the day. Visited today and validated. It's fully blocked.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_15",
        status: "reported",
        title: "Sanitation Blockage Logged",
        description: "Sunita Devi reported heavy garbage clogging near the Nehru Place commercial zone.",
        updatedBy: "Sunita Devi",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_16",
        status: "validated",
        title: "Community Validated",
        description: "The issue has been validated by multiple business owners and civic members.",
        updatedBy: "System Core",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_8",
    title: "Cracked Stone Pavement and Missing Curbs near Rajouri Garden Metro",
    description: "The decorative concrete tiles outside the Rajouri Garden Metro entrance are shattered and loose. Furthermore, about 15 meters of granite road curb has completely collapsed, leaving an open drop-off onto the main vehicular carriageway. Multiple shoppers have tripped and fallen here during late-night hours.",
    category: "broken_roads",
    status: "resolved",
    locationName: "Main Entrance Walkway, Rajouri Garden Metro, Main Market",
    neighborhood: "West Delhi",
    latitude: 30,
    longitude: 15,
    reporterName: "Rahul Gupta",
    reporterEmail: "rahul.g@civic.in",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["priya.s@gmail.com", "sarah.j@civic.org", "rohit.s@yahoo.com"],
    flags: [],
    gravityScore: 6,
    gravityJustification: "Heavy pedestrian impact. Located directly outside a major metro transit station feeding a famous shopping district. Shattered stones and missing curbs are dangerous trip hazards, especially during the festive seasons with massive crowd density.",
    actionSteps: [
      "1. Put up temporary barricades and caution tapes around the collapsed curb section.",
      "2. Strip the damaged stone tiles and lay a strong, uniform concrete base.",
      "3. Place high-density interlocking block tiles for longevity.",
      "4. Install heavy-duty granite curb blocks anchored with steel dowels."
    ],
    officialRequestDraft: "To the Delhi Metro Rail Corporation (DMRC) & PWD Delhi,\n\nWe wish to draw attention to the highly degraded public walkway directly outside Rajouri Garden Metro Station. The paving stone slabs have broken into sharp fragments, and the street curb is missing completely, exposing shoppers to high-speed vehicular traffic.\n\nThis walkway requires complete restoration to ensure commuter safety. We hope you will prioritize this busy spot.\n\nSincerely,\nRajouri Garden Resident Welfare Association",
    photoUrl: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=600",
    resolutionNotes: "All broken paving stones removed. Laid standard high-strength interlocking block tiles. Rebuilt 15 meters of granite curb reinforced with concrete footing. Fully inspected and opened for public walk.",
    resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: "c_10",
        userName: "Priya Sharma",
        userEmail: "priya.s@gmail.com",
        text: "The new tile layout is fantastic. Much safer and looks far more premium. Thanks for fixing this so quickly!",
        createdAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_17",
        status: "reported",
        title: "Pavement Damage Reported",
        description: "Rahul Gupta reported shattered pavers and collapsed curbs outside Rajouri Garden Metro.",
        updatedBy: "Rahul Gupta",
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_18",
        status: "validated",
        title: "Community Verified",
        description: "Verified by 3 community contributors. Forwarded to public engineering.",
        updatedBy: "System Core",
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_19",
        status: "in_progress",
        title: "Repairs Initiated",
        description: "Contractor mobilized crew to strip old stones and pour concrete foundation.",
        updatedBy: "DMRC Engineering Team",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_20",
        status: "resolved",
        title: "Walkway Restored",
        description: "Completed repaving and granite curb installation. Final inspection done.",
        updatedBy: "DMRC Engineering Team",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_9",
    title: "Broken Streetlights on Dwarka Sector 10 Crossing",
    description: "The high-mast lighting system at the central crossing of Dwarka Sector 10 is completely out of order. At night, this major multi-way roundabout is pitch dark. Drivers cannot see pedestrians crossing, and multiple near-misses have been observed in the last week. Local residents are afraid to cross after 8 PM.",
    category: "electricity_poles",
    status: "validated",
    locationName: "Central Roundabout, Dwarka Sector 10, New Delhi",
    neighborhood: "West Delhi",
    latitude: 15,
    longitude: 45,
    reporterName: "Rajesh Kumar",
    reporterEmail: "rajesh.k@gmail.com",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["sunita.d@outlook.com", "sarah.j@civic.org", "james.c@gmail.com"],
    flags: [],
    gravityScore: 8,
    gravityJustification: "Severe vehicular safety concern. High-mast lights illuminate critical multi-lane roundabouts. Pitch-dark conditions at a busy roundabout with no signals lead to extreme collision risks and pedestrian fatalities.",
    actionSteps: [
      "1. Issue an urgent ticket to DDA electrical wing for high-mast control gear inspection.",
      "2. Inspect the central timer switchboard to check for burnt contactors.",
      "3. Replace non-functional high-pressure sodium luminaires with modern high-lumen LED floods.",
      "4. Temporary deployment of battery-powered hazard flashing signals."
    ],
    officialRequestDraft: "To the Delhi Development Authority (DDA) Electrical Zone,\n\nWe are formally reporting a complete failure of the high-mast lighting pole at the central roundabout in Dwarka Sector 10. The entire intersection is plunged into total darkness every night.\n\nThis roundabout is extremely busy, and without proper lighting, pedestrian and driver visibility is practically zero. We urge you to deploy an emergency repair truck with a cherry picker to restore these lights.\n\nSincerely,\nDwarka Residents Federation",
    photoUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=600",
    comments: [
      {
        id: "c_11",
        userName: "James Carter",
        userEmail: "james.c@gmail.com",
        text: "Drove through here yesterday. It's incredibly dark, almost missed the curb. Validated. Needs urgent fixing.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_21",
        status: "reported",
        title: "High-Mast Outage Reported",
        description: "Rajesh Kumar reported a dark roundabout crossing at Dwarka Sec 10.",
        updatedBy: "Rajesh Kumar",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_22",
        status: "validated",
        title: "Community Validated",
        description: "Validated by multiple residents. Escalated to the DDA Works Dept.",
        updatedBy: "System Core",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_10",
    title: "Waterlogging & Open Potholes, G.T. Karnal Road, Azadpur",
    description: "During light showers, a huge stretch of the GT Karnal Road near the Azadpur Fruit Mandi is severely waterlogged due to clogged roadside drains. Underwater potholes are invisible, causing auto-rickshaws and cycle-rickshaws to overturn frequently. The traffic congestion here is spilling onto the national highway.",
    category: "open_potholes",
    status: "in_progress",
    locationName: "GT Karnal Road, opposite Azadpur Fruit Mandi, Azadpur",
    neighborhood: "North Delhi",
    latitude: 10,
    longitude: 80,
    reporterName: "Amit Verma",
    reporterEmail: "amit.v@civic.in",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["rajesh.k@gmail.com", "maria.g@gmail.com"],
    flags: [],
    gravityScore: 8,
    gravityJustification: "Severe economic and safety threat. Azadpur is Asia's largest agricultural market. Heavy transport trucks and lightweight rickshaws share this flooded road. Hidden waterlogged potholes cause regular vehicle tip-overs and gridlocks.",
    actionSteps: [
      "1. Deploy water pumps to drain the stagnant water from the highway shoulder.",
      "2. Clear municipal silt catchers along the GT Karnal road drainage line.",
      "3. Fill invisible submerged potholes using high-grade ready-mix cold asphalt bags immediately.",
      "4. Schedule long-term stormwater pipeline desilting and rebuilding."
    ],
    officialRequestDraft: "To the Public Works Department (PWD) & MCD Delhi,\n\nWe request immediate, emergency intervention on GT Karnal Road outside the Azadpur Mandi. Heavy waterlogging is submerging massive potholes, making it impossible to see the road surface.\n\nSeveral commercial loaders and auto-rickshaws have tilted or flipped over, spilling goods and injuring drivers. This is choking a vital highway connection. Please clear the drains and patch the road immediately.\n\nSincerely,\nAzadpur Mandi Traders Association",
    photoUrl: "https://images.unsplash.com/photo-1485594050903-8e8ee7b071a8?auto=format&fit=crop&q=80&w=600",
    comments: [
      {
        id: "c_12",
        userName: "MCD Engineer Sharma",
        userEmail: "k.sharma@mcd.gov.in",
        text: "Two high-capacity diesel water pumps deployed today. Crew is currently extracting plastic silt from the shoulder drain lines. Repairing potholes overnight.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_23",
        status: "reported",
        title: "Waterlogging/Pothole Alert",
        description: "Amit Verma filed an emergency report concerning GT Karnal Road flooding.",
        updatedBy: "Amit Verma",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_24",
        status: "validated",
        title: "Emergency Verified",
        description: "Verified by nearby traders. Marked as high-priority highway hazard.",
        updatedBy: "System Core",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_25",
        status: "in_progress",
        title: "Pumps Deployed",
        description: "Dewatering pumps and desilting crew mobilized on site.",
        updatedBy: "MCD Engineering Division",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "iss_11",
    title: "Unregulated Commercial Waste Dumping behind Model Town Marketplace",
    description: "Several banquet halls and wholesale vendors are dumping massive volumes of food waste and single-use plastic plates directly onto the municipal service lane behind the Model Town market. This has created an illegal dump site spanning over 50 meters, attracting packs of stray dogs and emitting a foul smell that reaches nearby residential blocks.",
    category: "sanitation",
    status: "resolved",
    locationName: "Service Lane behind Model Town II Commercial Complex",
    neighborhood: "North Delhi",
    latitude: 20,
    longitude: 30,
    reporterName: "Sunita Devi",
    reporterEmail: "sunita.d@outlook.com",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    validations: ["alex.rivera@civic.org", "sarah.j@civic.org", "rohit.s@yahoo.com", "priya.s@gmail.com"],
    flags: [],
    gravityScore: 7,
    gravityJustification: "Public health concern. Large-scale decomposing food waste in a residential-adjacent lane attracts disease vectors. Stray dogs feeding there have led to multiple bite incidents for children walking to a nearby park.",
    actionSteps: [
      "1. Deploy heavy front-end loaders and dump trucks to excavate the entire waste pile.",
      "2. Apply sanitizing chemical powder and lime wash to neutralize odors and disinfect the soil.",
      "3. Erect 'No Littering' metal signs and coordinate with local police to monitor commercial vehicles.",
      "4. Issue heavy administrative fines to the identified banquet halls."
    ],
    officialRequestDraft: "To the Commissioner, Municipal Corporation of Delhi (MCD),\n\nWe are writing to report a major environmental health violation behind the Model Town II market. Several banquet halls are dumping commercial organic waste on public service roads, completely blocking vehicle movement and creating a toxic waste breeding ground.\n\nStray animal density has skyrocketed, endangering local children. We request immediate excavation of this waste and heavy punitive action against the commercial entities involved.\n\nSincerely,\nModel Town Residents Welfare Association (RWA)",
    photoUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600",
    resolutionNotes: "MCD sanitation loaders cleared 14 tons of garbage. Service lane thoroughly disinfected with bleach and lime powder. Installed concrete barricades to prevent commercial vehicles from dumping. Fined three banquet halls INR 25,000 each.",
    resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: "c_13",
        userName: "Sunita Devi",
        userEmail: "sunita.d@outlook.com",
        text: "The lane is finally clean and clear! I can walk my kids to the park safely now. Thank you so much for the heavy fines, it was the only way to teach these commercial halls a lesson.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: "t_26",
        status: "reported",
        title: "Commercial Dumping Logged",
        description: "Sunita Devi reported large-scale food waste dumping behind Model Town market.",
        updatedBy: "Sunita Devi",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_27",
        status: "validated",
        title: "Community Mobilized",
        description: "Validated by 4 community members. Escalated with signatures to MCD Commissioner.",
        updatedBy: "System Core",
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_28",
        status: "in_progress",
        title: "Clearance Action Started",
        description: "MCD heavy machinery dispatched to clear the service lane.",
        updatedBy: "MCD Sanitation Wing",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "t_29",
        status: "resolved",
        title: "Waste Cleared & Fines Issued",
        description: "All refuse removed, lane disinfected, and offending parties fined. Surveillance mounted.",
        updatedBy: "MCD Sanitation Wing",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

function readDB(): Issue[] {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(SEED_ISSUES, null, 2), 'utf-8');
      return SEED_ISSUES;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading db file, using seeds/memory:", err);
    return SEED_ISSUES;
  }
}

function writeDB(issues: Issue[]) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(issues, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing db file:", err);
  }
}

function readVouchers(): RedeemedVoucher[] {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(VOUCHERS_FILE)) {
      fs.writeFileSync(VOUCHERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const data = fs.readFileSync(VOUCHERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading vouchers file:", err);
    return [];
  }
}

function writeVouchers(vouchers: RedeemedVoucher[]) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(vouchers, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing vouchers file:", err);
  }
}

function readPreferences(): Record<string, { showName: boolean }> {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(PREFERENCES_FILE)) {
      fs.writeFileSync(PREFERENCES_FILE, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const data = fs.readFileSync(PREFERENCES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading user preferences file:", err);
    return {};
  }
}

function writePreferences(prefs: Record<string, { showName: boolean }>) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing user preferences file:", err);
  }
}

// In-memory runtime state initially populated
let localIssues: Issue[] = readDB();

// Helper to initialize Gemini SDK safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("WARNING: GEMINI_API_KEY not configured or has placeholder value. Falling back to simulated AI analysis.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// REST API Endpoints

app.get("/api/config/maps-key", (req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_PLATFORM_KEY || "" });
});

// 1. Get stats
app.get("/api/stats", (req, res) => {
  const issues = readDB();
  const total = issues.length;
  const resolved = issues.filter(i => i.status === 'resolved').length;
  const active = total - resolved;
  const validations = issues.reduce((acc, curr) => acc + curr.validations.length, 0);

  // Calculate average resolution time for resolved issues
  let totalDays = 0;
  let resolvedCount = 0;
  issues.forEach(i => {
    if (i.status === 'resolved' && i.resolvedAt) {
      const created = new Date(i.createdAt).getTime();
      const resolvedT = new Date(i.resolvedAt).getTime();
      const diffDays = Math.ceil((resolvedT - created) / (1000 * 60 * 60 * 24));
      totalDays += Math.max(diffDays, 1);
      resolvedCount++;
    }
  });
  const avgResDays = resolvedCount > 0 ? Math.round((totalDays / resolvedCount) * 10) / 10 : 4.5;

  const categoryDistribution = {
    broken_roads: issues.filter(i => i.category === 'broken_roads').length,
    open_potholes: issues.filter(i => i.category === 'open_potholes').length,
    electricity_poles: issues.filter(i => i.category === 'electricity_poles').length,
    sanitation: issues.filter(i => i.category === 'sanitation').length,
  };

  const neighborhoodDistribution: Record<string, number> = {};
  const statusDistribution = {
    reported: issues.filter(i => i.status === 'reported').length,
    validated: issues.filter(i => i.status === 'validated').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  };

  issues.forEach(i => {
    neighborhoodDistribution[i.neighborhood] = (neighborhoodDistribution[i.neighborhood] || 0) + 1;
  });

  res.json({
    totalIssues: total,
    resolvedIssues: resolved,
    activeIssues: active,
    validationCount: validations,
    averageResolutionDays: avgResDays,
    categoryDistribution,
    neighborhoodDistribution,
    statusDistribution
  });
});

// 2. Get all issues
app.get("/api/issues", (req, res) => {
  const issues = readDB();
  // Sort descending by created date
  const sorted = [...issues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sorted);
});

// 3. Get single issue
app.get("/api/issues/:id", (req, res) => {
  const issues = readDB();
  const issue = issues.find(i => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }
  res.json(issue);
});

// 4. Create new issue with optional AI analysis
app.post("/api/issues", async (req, res) => {
  const { title, description, category, locationName, neighborhood, latitude, longitude, reporterName, reporterEmail, photoUrl } = req.body;

  if (!title || !description || !category || !locationName || !neighborhood) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const issues = readDB();
  const newId = `iss_${Date.now()}`;

  let isCommunityIssue = true;
  let finalCategory = category;
  let gravityScore = 5;
  let gravityJustification = "Assigned a baseline gravity level of 5 pending verification.";
  let actionSteps: string[] = [
    "1. Dispatched initial inspector for physical assessment.",
    "2. Secure surrounding parameters if pedestrian walking path is restricted.",
    "3. Queue for maintenance planning review."
  ];
  let officialRequestDraft = `To the City Council,\n\nWe would like to formally request municipal review of a community issue regarding '${title}' located at ${locationName}.\n\nThis concern has been reported by local residents who request a formal assessment and schedule of repair.\n\nSincerely,\nLocal Residents of ${neighborhood}`;

  // Attempt to call Gemini API
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the following citizen report about a municipal or community issue. Determine if it is a genuine public issue (broken roads, potholes, broken street lights, electrical line safety, trash pileup, sanitation leaks, clogged storm drains). If not, flag it.
Assign a severity gravity score from 1 to 10 (10 being immediate hazard to human life or health), justify the score, suggest a step-by-step contractor resolution plan, and write an official municipal request letter citizens can print or mail to their local representatives.

Citizen Report Title: "${title}"
Citizen Report Description: "${description}"
Reported Category: "${category}"
Location: "${locationName} (${neighborhood})"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCommunityIssue: { type: Type.BOOLEAN, description: "Whether the description is a valid public community issue" },
              category: { type: Type.STRING, description: "Categorized issue type. Must be one of: broken_roads, open_potholes, electricity_poles, sanitation" },
              gravityScore: { type: Type.INTEGER, description: "Severity score from 1 (minor) to 10 (life-threatening emergency)" },
              gravityJustification: { type: Type.STRING, description: "Justification explaining why the gravity score was given and what specific dangers exist" },
              actionSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Step-by-step resolution plan that municipal workers or contractors must execute to solve the issue (aim for 3-5 concise steps)"
              },
              officialRequestDraft: { type: Type.STRING, description: "A formal, professional draft of a municipal letter or public request written on behalf of citizens" }
            },
            required: ["isCommunityIssue", "category", "gravityScore", "gravityJustification", "actionSteps", "officialRequestDraft"]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        isCommunityIssue = parsed.isCommunityIssue !== false;
        finalCategory = parsed.category || category;
        gravityScore = Math.min(Math.max(Number(parsed.gravityScore) || 5, 1), 10);
        gravityJustification = parsed.gravityJustification || gravityJustification;
        if (parsed.actionSteps && Array.isArray(parsed.actionSteps)) {
          actionSteps = parsed.actionSteps;
        }
        officialRequestDraft = parsed.officialRequestDraft || officialRequestDraft;
      }
    } catch (err) {
      console.error("Gemini API call failed, reverting to simulated AI engine:", err);
      // Generate simulated but high-quality AI results based on keywords
      const lowerDesc = description.toLowerCase();
      if (lowerDesc.includes("accident") || lowerDesc.includes("danger") || lowerDesc.includes("hurt") || lowerDesc.includes("kid") || lowerDesc.includes("elderly") || lowerDesc.includes("night") && category === "electricity_poles") {
        gravityScore = 8;
        gravityJustification = `Simulated AI: High gravity score (${gravityScore}/10) assigned due to safety keywords indicating vulnerability, school proximity, or vehicle collision risk in active zones.`;
      } else {
        gravityScore = Math.floor(Math.random() * 4) + 4; // 4-7
        gravityJustification = `Simulated AI: Moderate gravity score of ${gravityScore}/10 assigned for general public property degradation. Remediation is standard utility task.`;
      }
    }
  } else {
    // Highly relevant local heuristics when no API key is available
    const descLower = description.toLowerCase();
    const titleLower = title.toLowerCase();
    
    // Heuristics to estimate gravity
    let estimatedScore = 5;
    let reason = "Moderate concern with standard service response path.";
    
    if (descLower.includes("school") || descLower.includes("child") || descLower.includes("kid") || descLower.includes("accident") || descLower.includes("crash")) {
      estimatedScore = 8;
      reason = "Elevated threat score due to immediate proximity to vulnerable populations (school zone/children) and increased traffic collision or pedestrian hazard.";
    } else if (descLower.includes("leak") && descLower.includes("water") && category === "sanitation") {
      estimatedScore = 7;
      reason = "High sanitation alert: stagnant wastewater leaks breed vectors and undermine structural pavement integrity.";
    } else if (category === "electricity_poles" && (descLower.includes("dark") || descLower.includes("wire") || descLower.includes("fell"))) {
      estimatedScore = descLower.includes("fell") || descLower.includes("wire") ? 9 : 6;
      reason = descLower.includes("fell") || descLower.includes("wire") 
        ? "Severe safety alert: exposed or fallen lines pose immediate high-voltage electrocution and fire hazards."
        : "Medium electric alert: dark junction lines reduce pedestrian visibility and double crime opportunities.";
    } else if (category === "open_potholes") {
      estimatedScore = descLower.includes("deep") || descLower.includes("tire") ? 7 : 5;
      reason = "Vehicular safety alert: pothole is prone to causing direct damage to wheels or inducing sudden steering swerves.";
    }

    gravityScore = estimatedScore;
    gravityJustification = `Automated Civic Analysis: ${reason}`;
    
    actionSteps = [
      `1. Log issue in municipal queue for ${category.replace('_', ' ')}.`,
      "2. Schedule field validation and map tagging.",
      "3. Inspect surrounding pavement and infrastructure assets for compounding wear.",
      "4. Dispatch repair team with safety parameters."
    ];
    
    officialRequestDraft = `To whom it may concern,\n\nWe are formally petitioning for the inspection and immediate repair of a public infrastructure failure: "${title}". This issue is located at ${locationName} (${neighborhood}).\n\nCitizens have registered multiple safety concerns regarding this defect, which has been assessed at a severity rating of ${gravityScore}/10.\n\nWe request a technician visit the site within the standard 7-day service window.\n\nSincerely,\nLocal Residents of ${neighborhood}`;
  }

  const newIssue: Issue = {
    id: newId,
    title,
    description,
    category: finalCategory,
    status: "reported",
    locationName,
    neighborhood,
    latitude: latitude || 50,
    longitude: longitude || 50,
    reporterName: reporterName || "Anonymous Citizen",
    reporterEmail: reporterEmail || "anonymous@civic.org",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    validations: [],
    flags: [],
    gravityScore,
    gravityJustification,
    actionSteps,
    officialRequestDraft,
    comments: [],
    timeline: [
      {
        id: `t_init_${Date.now()}`,
        status: "reported",
        title: "Report Submitted",
        description: `Citizen ${reporterName || "Anonymous"} reported this issue. Gravity was assessed by AI at ${gravityScore}/10.`,
        updatedBy: reporterName || "Citizen",
        createdAt: new Date().toISOString()
      }
    ],
    photoUrl: photoUrl || `https://images.unsplash.com/photo-1596522354195-e84ae3c98731?auto=format&fit=crop&q=80&w=600` // generic placeholder
  };

  issues.push(newIssue);
  writeDB(issues);
  res.status(201).json(newIssue);
});

// 5. Validate issue (citizen upvote)
app.post("/api/issues/:id/validate", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required to validate" });
  }

  const issues = readDB();
  const index = issues.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const issue = issues[index];
  if (issue.validations.includes(email)) {
    return res.status(400).json({ error: "You have already validated this issue" });
  }

  // Add validation
  issue.validations.push(email);
  issue.updatedAt = new Date().toISOString();

  // If issue transitions from reported to validated (requires e.g. 3 validations)
  const isNowValidated = issue.status === 'reported' && issue.validations.length >= 3;
  if (isNowValidated) {
    issue.status = 'validated';
    issue.timeline.push({
      id: `t_val_${Date.now()}`,
      status: 'validated',
      title: "Community Verified",
      description: `Issue reached 3 validations. Upgraded to 'Community Verified' and prioritized for municipal action.`,
      updatedBy: "System Core",
      createdAt: new Date().toISOString()
    });
  } else {
    // Add generic validation event
    issue.timeline.push({
      id: `t_val_inc_${Date.now()}`,
      status: issue.status,
      title: "Citizen Verification Added",
      description: `Citizen verified that this issue remains unresolved and requires action. (Total: ${issue.validations.length})`,
      updatedBy: "Citizen",
      createdAt: new Date().toISOString()
    });
  }

  writeDB(issues);
  res.json(issue);
});

// 6. Flag issue (duplicate/spam)
app.post("/api/issues/:id/flag", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required to flag" });
  }

  const issues = readDB();
  const index = issues.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const issue = issues[index];
  if (issue.flags.includes(email)) {
    return res.status(400).json({ error: "You have already flagged this issue" });
  }

  issue.flags.push(email);
  issue.updatedAt = new Date().toISOString();

  issue.timeline.push({
    id: `t_flag_${Date.now()}`,
    status: issue.status,
    title: "Flag Registered",
    description: `Citizen flagged this issue as duplicate, resolved, or inappropriate.`,
    updatedBy: "Citizen",
    createdAt: new Date().toISOString()
  });

  writeDB(issues);
  res.json(issue);
});

// 7. Add Comment
app.post("/api/issues/:id/comments", (req, res) => {
  const { userName, userEmail, text } = req.body;
  if (!userName || !userEmail || !text) {
    return res.status(400).json({ error: "Missing comment details" });
  }

  const issues = readDB();
  const index = issues.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const issue = issues[index];
  const newComment: Comment = {
    id: `c_${Date.now()}`,
    userName,
    userEmail,
    text,
    createdAt: new Date().toISOString()
  };

  issue.comments.push(newComment);
  issue.updatedAt = new Date().toISOString();

  writeDB(issues);
  res.json(newComment);
});

// 8. Update Status (Municipal Simulator)
app.post("/api/issues/:id/status", (req, res) => {
  const { status, resolutionNotes, updatedBy } = req.body;
  if (!status || !updatedBy) {
    return res.status(400).json({ error: "Missing status update details" });
  }

  const issues = readDB();
  const index = issues.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const issue = issues[index];
  const prevStatus = issue.status;
  issue.status = status;
  issue.updatedAt = new Date().toISOString();

  let eventTitle = "Status Updated";
  let eventDesc = `Status updated from '${prevStatus}' to '${status}'.`;

  if (status === 'in_progress') {
    eventTitle = "Repair In Progress";
    eventDesc = `Municipal contractor has been actively scheduled and dispatched. Repair crews are on site.`;
  } else if (status === 'resolved') {
    eventTitle = "Resolved Successfully";
    eventDesc = resolutionNotes || `Work completed and verified. Roadway/utility fully restored.`;
    issue.resolutionNotes = resolutionNotes;
    issue.resolvedAt = new Date().toISOString();
  }

  issue.timeline.push({
    id: `t_status_${Date.now()}`,
    status,
    title: eventTitle,
    description: eventDesc,
    updatedBy,
    createdAt: new Date().toISOString()
  });

  writeDB(issues);
  res.json(issue);
});

// 8.5 Get and Update user privacy preferences for the leaderboard
app.get("/api/user-preferences", (req, res) => {
  const email = (req.query.email as string || '').toLowerCase().trim();
  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }
  const prefs = readPreferences();
  const userPref = prefs[email];
  res.json({
    email,
    showName: userPref ? userPref.showName : true
  });
});

app.post("/api/user-preferences", (req, res) => {
  const { email, showName } = req.body;
  const userEmail = (email || '').toLowerCase().trim();
  if (!userEmail) {
    return res.status(400).json({ error: "Email is required" });
  }
  if (typeof showName !== 'boolean') {
    return res.status(400).json({ error: "showName must be a boolean value" });
  }

  const prefs = readPreferences();
  prefs[userEmail] = { showName };
  writePreferences(prefs);

  res.json({
    success: true,
    email: userEmail,
    showName
  });
});

// 9. Get Dynamic Leaderboard data
app.get("/api/leaderboard", (req, res) => {
  const issues = readDB();
  const prefs = readPreferences();
  const allRedeemed = readVouchers();
  const viewerEmail = (req.query.email as string || '').toLowerCase().trim();
  const viewerRole = (req.query.role as string || '').toLowerCase().trim();
  const usersMap: Record<string, { name: string; email: string; reports: number; validations: number; comments: number }> = {};

  // Accumulate counts from issues
  issues.forEach(i => {
    // Reporter
    const rEmail = i.reporterEmail;
    if (rEmail) {
      if (!usersMap[rEmail]) {
        usersMap[rEmail] = { name: i.reporterName || "Anonymous", email: rEmail, reports: 0, validations: 0, comments: 0 };
      }
      usersMap[rEmail].reports++;
    }

    // Validations
    i.validations.forEach(email => {
      if (!usersMap[email]) {
        const namePart = email.split('@')[0];
        const readableName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace('.', ' ');
        usersMap[email] = { name: readableName, email, reports: 0, validations: 0, comments: 0 };
      }
      usersMap[email].validations++;
    });

    // Comments
    i.comments.forEach(c => {
      const cEmail = c.userEmail;
      if (cEmail) {
        if (!usersMap[cEmail]) {
          usersMap[cEmail] = { name: c.userName, email: cEmail, reports: 0, validations: 0, comments: 0 };
        }
        usersMap[cEmail].comments++;
      }
    });
  });

  // Calculate scores and badges
  const leaderboard: any[] = Object.values(usersMap).map(u => {
    // Score formula: Report = 15 pts, Validation = 5 pts, Comment = 3 pts
    const score = (u.reports * 15) + (u.validations * 5) + (u.comments * 3);
    let badge = "Civic Novice";
    if (score >= 100) badge = "Civic Guardian";
    else if (score >= 50) badge = "Community Leader";
    else if (score >= 20) badge = "Active Patriot";

    // Spent points and wallet balance
    const userRedeemed = allRedeemed.filter(v => v.userEmail.toLowerCase() === u.email.toLowerCase().trim());
    const spentPoints = userRedeemed.reduce((sum, v) => sum + v.cost, 0);
    const walletBalance = Math.max(score - spentPoints, 0);

    const userPref = prefs[u.email.toLowerCase().trim()];
    const showName = userPref ? userPref.showName : true;
    const isMe = viewerEmail && u.email.toLowerCase().trim() === viewerEmail;
    const isAdmin = viewerRole === 'head' || viewerRole === 'official';

    let emailToShow = u.email;
    let nameToShow = u.name;
    let visibleToAdminOnly = false;

    if (!showName) {
      if (isAdmin) {
        visibleToAdminOnly = true;
        nameToShow = u.name;
        emailToShow = u.email;
      } else {
        nameToShow = "Anonymous Citizen";
        const parts = u.email.split('@');
        if (parts.length === 2) {
          const local = parts[0];
          const domain = parts[1];
          if (local.length > 2) {
            emailToShow = `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
          } else {
            emailToShow = `***@${domain}`;
          }
        } else {
          emailToShow = "Hidden";
        }
      }
    }

    return {
      name: nameToShow,
      email: emailToShow,
      reportsCount: u.reports,
      validationsCount: u.validations,
      commentsCount: u.comments,
      score,
      spentPoints,
      walletBalance,
      badge,
      showName,
      isMe: !!isMe,
      visibleToAdminOnly
    };
  });

  // Sort descending by score
  const sorted = leaderboard.sort((a, b) => b.score - a.score);
  res.json(sorted);
});

const AVAILABLE_VOUCHERS = [
  {
    id: 'metro_pass',
    title: 'Free Public Metro Pass (1-Day)',
    cost: 30,
    description: 'Unlimited 1-day travel across all Metro routes in Delhi NCR.',
    provider: 'Delhi Metro Rail Corporation',
    icon: 'Train'
  },
  {
    id: 'parking_waiver',
    title: 'Municipal Parking Fee Waiver',
    cost: 20,
    description: '5 hours of free parking in any authorized MCD municipal parking facility.',
    provider: 'Municipal Corporation of Delhi',
    icon: 'SquarePark'
  },
  {
    id: 'seedling_kit',
    title: 'Green Seedling & Compost Kit',
    cost: 15,
    description: 'A potted green plant seedling and premium organic kitchen waste compost.',
    provider: 'Department of City Nursery & Forestry',
    icon: 'Leaf'
  },
  {
    id: 'library_pass',
    title: 'Premium Library Pass (1-Month)',
    cost: 40,
    description: 'Borrow up to 5 books concurrently and access digital journals.',
    provider: 'City Central Public Library',
    icon: 'BookOpen'
  },
  {
    id: 'coffee_mug',
    title: 'Civic Hero Ceramic Coffee Mug',
    cost: 50,
    description: 'A beautifully printed ceramic mug with your custom name and civic badge.',
    provider: 'City Hall Souvenir Department',
    icon: 'Coffee'
  },
  {
    id: 'zoo_ticket',
    title: 'City Zoo Entry Pass (Single)',
    cost: 25,
    description: 'One complimentary adult entry ticket to the Delhi National Zoological Park.',
    provider: 'National Zoological Park',
    icon: 'Ticket'
  },
  {
    id: 'marathon_jersey',
    title: 'Swachh Marathon Runner Jersey',
    cost: 10,
    description: 'Get a premium dry-fit runner jersey for the upcoming Swachh Delhi Marathon.',
    provider: 'Directorate of Youth & Sports',
    icon: 'Shirt'
  }
];

// 10. Get available and redeemed vouchers for a specific user
app.get("/api/vouchers", (req, res) => {
  const email = (req.query.email as string || '').toLowerCase().trim();
  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }

  // Calculate points earned from the DB
  const issues = readDB();
  let reports = 0;
  let validations = 0;
  let comments = 0;

  issues.forEach(i => {
    if (i.reporterEmail && i.reporterEmail.toLowerCase() === email) {
      reports++;
    }
    if (i.validations) {
      i.validations.forEach(vEmail => {
        if (vEmail.toLowerCase() === email) {
          validations++;
        }
      });
    }
    if (i.comments) {
      i.comments.forEach(c => {
        if (c.userEmail && c.userEmail.toLowerCase() === email) {
          comments++;
        }
      });
    }
  });

  const totalPointsEarned = (reports * 15) + (validations * 5) + (comments * 3);

  // Read redeemed vouchers
  const allRedeemed = readVouchers();
  const userRedeemed = allRedeemed.filter(v => v.userEmail.toLowerCase() === email);
  const spentPoints = userRedeemed.reduce((sum, v) => sum + v.cost, 0);
  const pointsBalance = totalPointsEarned - spentPoints;

  res.json({
    availableVouchers: AVAILABLE_VOUCHERS,
    redeemedVouchers: userRedeemed,
    totalPointsEarned,
    spentPoints,
    pointsBalance
  });
});

// 11. Redeem a voucher
app.post("/api/vouchers/redeem", (req, res) => {
  const { email, voucherId } = req.body;
  const userEmail = (email || '').toLowerCase().trim();
  if (!userEmail || !voucherId) {
    return res.status(400).json({ error: "Email and voucherId are required" });
  }

  const voucherTemplate = AVAILABLE_VOUCHERS.find(v => v.id === voucherId);
  if (!voucherTemplate) {
    return res.status(404).json({ error: "Voucher option not found" });
  }

  // Calculate user points balance
  const issues = readDB();
  let reports = 0;
  let validations = 0;
  let comments = 0;

  issues.forEach(i => {
    if (i.reporterEmail && i.reporterEmail.toLowerCase() === userEmail) {
      reports++;
    }
    if (i.validations) {
      i.validations.forEach(vEmail => {
        if (vEmail.toLowerCase() === userEmail) {
          validations++;
        }
      });
    }
    if (i.comments) {
      i.comments.forEach(c => {
        if (c.userEmail && c.userEmail.toLowerCase() === userEmail) {
          comments++;
        }
      });
    }
  });

  const totalPointsEarned = (reports * 15) + (validations * 5) + (comments * 3);

  const allRedeemed = readVouchers();
  const userRedeemed = allRedeemed.filter(v => v.userEmail.toLowerCase() === userEmail);
  const spentPoints = userRedeemed.reduce((sum, v) => sum + v.cost, 0);
  const pointsBalance = totalPointsEarned - spentPoints;

  if (pointsBalance < voucherTemplate.cost) {
    return res.status(400).json({ 
      error: `Insufficient points balance. You need ${voucherTemplate.cost} points to redeem this voucher, but you currently have ${pointsBalance} points.` 
    });
  }

  // Generate a realistic mock voucher redemption code
  const codePrefix = voucherTemplate.id.slice(0, 4).toUpperCase();
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  const promoCode = `CIVIC-${codePrefix}-${randomChars}`;

  const newRedemption: RedeemedVoucher = {
    id: 'red_' + Math.random().toString(36).substring(2, 9),
    voucherId: voucherTemplate.id,
    title: voucherTemplate.title,
    cost: voucherTemplate.cost,
    provider: voucherTemplate.provider,
    code: promoCode,
    redeemedAt: new Date().toISOString(),
    userEmail
  };

  allRedeemed.push(newRedemption);
  writeVouchers(allRedeemed);

  res.json({
    success: true,
    redeemedVoucher: newRedemption,
    newBalance: pointsBalance - voucherTemplate.cost
  });
});

// Admin/Developer endpoints to view or download raw db.json
app.get("/db.json", (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    res.sendFile(DB_FILE);
  } else {
    res.status(404).json({ error: "db.json does not exist yet." });
  }
});

app.get("/api/db", (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    res.sendFile(DB_FILE);
  } else {
    res.status(404).json({ error: "db.json does not exist yet." });
  }
});

app.get("/api/db.json", (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    res.sendFile(DB_FILE);
  } else {
    res.status(404).json({ error: "db.json does not exist yet." });
  }
});

// Setup Vite Middleware or Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite HMR disabled.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode.");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicWatch Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
