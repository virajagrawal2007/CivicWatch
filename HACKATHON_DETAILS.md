# CivicWatch Platform: Hackathon Submission Details

An interactive, end-to-end community reporting and gamified civic action platform connecting citizens and municipal heads to track, validate, and resolve public hazards in real-time.

---

## 1. Selected Problem Statement

Maintaining public urban infrastructure (such as broken streets, dangerous potholes, sanitation failures, electricity hazards, and open manholes) is fundamentally slowed by several critical factors:
- **Bureaucracy & Delay:** Reports get buried under disconnected municipal systems, resulting in long turnaround times.
- **Reporting Noise:** Systems are clogged by duplicate files, false reports, or unverified claims.
- **Lack of Public Verification:** Citizens do not have a transparent way to check if an issue is real or confirm its status, leading to distrust and citizen apathy.
- **Contractor Inefficiency:** Maintenance teams often receive unstructured data without pre-vetted severity scores, repair instructions, or clear navigational routes to guide repair operations.

---

## 2. Solution Overview

**CivicWatch** addresses this problem by delivering a highly responsive, single-page, full-stack reporting hub that builds an authentic, real-time collaboration loop between local citizens and department heads.

- **For the Public:** Citizens pin reports onto live maps with coordinate resolution, engage in discussion threads, crowdsource consensus checks ("Verify" Vouching), climb an active civic leaderboard, and earn redeemable real-world reward vouchers sponsored by local partners.
- **For Municipal Heads:** Admins access a dedicated Operations Control Center complete with priority matrices, statistical dashboards, route simulators, and an automated triaging engine powered by server-side AI.

---

## 3. Key Features

- **Interactive Civic Maps Locator:** Implements live coordinate pinning on vector maps. Features heatmaps that visualize hazard density per neighborhood, helping administrators spot high-priority failure clusters.
- **Smart Automated Triaging (Google Gemini):** Processes unstructured descriptions server-side, returning fully structured JSON data containing priority scores (1-10 severity scale) with engineering-grade safety justifications, recommended contractor remediation steps, and formatted official petition letters.
- **Crowdsourced Validation Engine:** Leverages peer-to-peer verification to calculate validation scores. An issue with high public verifications automatically ascends the admin priority queue.
- **Leaderboard with Granular Identity Controls:** Citizens earn civic contribution points (15 points for reporting, 5 for verifying, 3 for comments). Features a privacy manager that lets users toggle between a public profile and a fully anonymous citizen profile (where email is masked and name is hidden from general view while remaining safely visible to administrators).
- **Rewards Voucher Engine:** Converts earned contribution points into discount codes and partner vouchers from local municipal sponsors.
- **Operations Dashboard & Transit Navigator:** Enables department heads to change issue statuses, filter items, view real-time statistics charts, and simulate multi-stop transit routing for repair contractors.

---

## 4. Technologies Used

- **Frontend Stack:**
  - **React 19 & TypeScript:** Scalable, type-safe functional architecture.
  - **Tailwind CSS:** Fully customized, responsive utilities, featuring custom ambient and dark themes.
  - **Framer Motion (`motion/react`):** Smooth, responsive layout transitions and modal overlays.
  - **Recharts & D3:** Interactive statistical analytics charts tracking issues, resolution rates, and category distribution.
- **Backend Stack:**
  - **Node.js & Express (v4):** Light, robust API controller routing for issues, preferences, comments, and vouchers.
  - **esbuild Type-Stripping:** Robust ESM packaging and bundler compilation, outputting optimized bundles cleanly resolving ESM requirements.
- **Storage & Persistence:**
  - **JSON File-Backed Store:** Self-contained, durable local database tracking issues, comments, vouchers, and privacy profiles synchronously across restarts.

---

## 5. Google Technologies Utilized

- **Google Maps Platform (`@vis.gl/react-google-maps`):**
  - Interactive vector tiles map rendering.
  - Custom overlays, location-grounded marker clusters, and coordinate resolving.
  - Simulated physical routing for repair contractors.
- **Google Gemini API (`gemini-3.5-flash`):**
  - Leverages the modern `@google/genai` TypeScript SDK on the server side to proxy requests securely.
  - Structures messy human inputs, calculates 1-10 gravity ratings, drafts actionable contractor tasks, and writes formal citizen advocacy letters to the municipal assembly.
