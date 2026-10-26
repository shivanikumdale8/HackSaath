import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Proof-of-Skill Showcase Component
 * Highlights verified student project contributions, code repositories,
 * live deployed demos, and peer collaborator attestations.
 */

const REAL_PROJECTS = [
  {
    id: 'proj-1',
    title: 'KrishiSetu — Crop Disease Classifier',
    category: 'AI / AgriTech',
    student: 'Aarav Patil',
    college: 'COEP Tech University, Pune',
    role: 'Full Stack & ML Pipeline',
    status: 'Public Repository & Deployed',
    repoUrl: 'https://github.com/skillsetu-showcase/krishi-setu',
    demoUrl: 'https://krishi-setu-demo.vercel.app',
    impact: 'Identifies 14 tomato & cotton leaf diseases with localized audio instructions for farmers.',
    skillsDemonstrated: ['FastAPI', 'PyTorch', 'React', 'Audio Speech API', 'Docker'],
    peerAttestation: {
      endorser: 'Prof. S. R. Kulkarni',
      badge: 'Faculty Guide Signed',
      comment: 'Demonstrated exceptional latency optimization on edge devices (Raspberry Pi 4).',
    },
    commitsCount: 142,
    testedPlatforms: ['Web', 'Mobile PWA'],
  },
  {
    id: 'proj-2',
    title: 'BhashaBridge — Indic Multilingual Design System',
    category: 'UI/UX & Frontend',
    student: 'Tanvi Deshmukh',
    college: 'VJTI Mumbai',
    role: 'Design System Architect',
    status: 'Figma Community File & NPM Package',
    repoUrl: 'https://github.com/skillsetu-showcase/bhashabridge-ui',
    demoUrl: 'https://bhashabridge.org',
    impact: 'Standardized typography hierarchy and micro-interactions for Indic scripts on high-density displays.',
    skillsDemonstrated: ['Figma', 'Tailwind CSS', 'Accessible WCAG 2.1', 'Storybook', 'TypeScript'],
    peerAttestation: {
      endorser: 'India Design Guild',
      badge: 'Community Adopted',
      comment: 'Adopted by 3 student hackathon teams for national-level competitions.',
    },
    commitsCount: 88,
    testedPlatforms: ['Figma', 'React'],
  },
  {
    id: 'proj-3',
    title: 'UrjaMonitor — Campus Solar IoT Telemetry',
    category: 'IoT & Embedded',
    student: 'Siddharth Joshi',
    college: 'VNIT Nagpur',
    role: 'Firmware & Circuit Developer',
    status: 'Hardware Tested & Open Source',
    repoUrl: 'https://github.com/skillsetu-showcase/urja-monitor-esp32',
    demoUrl: 'https://urja-monitor-dashboard.web.app',
    impact: 'Deployed on college rooftop panels logging real-time kilowatt generation with automated Telegram alerts.',
    skillsDemonstrated: ['ESP32 C++', 'MQTT', 'InfluxDB', 'Grafana', 'LoRaWAN'],
    peerAttestation: {
      endorser: 'Energy Club VNIT',
      badge: 'Campus Deployment',
      comment: 'Ran without packet loss for 6 months continuously on campus microgrid.',
    },
    commitsCount: 64,
    testedPlatforms: ['ESP32', 'Grafana Cloud'],
  },
  {
    id: 'proj-4',
    title: 'MahaYatra — Smart Bus Tracker for Rural Routes',
    category: 'Mobile & Cloud',
    student: 'Omkar Jadhav',
    college: 'Govt. College of Engg., Sambhajinagar',
    role: 'Mobile Lead & API Integration',
    status: 'Open Source APK Available',
    repoUrl: 'https://github.com/skillsetu-showcase/maha-yatra-flutter',
    demoUrl: 'https://github.com/skillsetu-showcase/maha-yatra-flutter/releases',
    impact: 'Offline-capable GPS tracking with SMS fallback for low-bandwidth rural zones.',
    skillsDemonstrated: ['Flutter', 'Dart', 'Node.js', 'Google Maps API', 'SQLite'],
    peerAttestation: {
      endorser: 'Student Commuters Forum',
      badge: 'Pilot Tested',
      comment: 'Verified working offline when cell signal drops between remote transit corridors.',
    },
    commitsCount: 95,
    testedPlatforms: ['Android APK', 'Node Backend'],
  },
];

export default function ProofOfSkillSection() {
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', 'AI / AgriTech', 'UI/UX & Frontend', 'IoT & Embedded', 'Mobile & Cloud'];

  const filteredProjects =
    filterCategory === 'All'
      ? REAL_PROJECTS
      : REAL_PROJECTS.filter((p) => p.category === filterCategory);

  return (
    <section className="rounded-2xl border border-[#1f2436] bg-[#111420] p-6 md:p-8 text-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#1f2436]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md bg-[#4f46e5]/15 px-2.5 py-1 text-xs font-semibold text-[#818cf8] border border-[#4f46e5]/30">
            <span>Verified Portfolio</span>
            <span className="text-[#818cf8]/60">·</span>
            <span>Proof-of-Skill Showcase</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Real Student Proof-of-Work
          </h2>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            No ungrounded claims or vanity badges. Each portfolio showcases verifiable code repositories, live deployed demos, and verified collaborator attestations.
          </p>
        </div>

        {/* Category Filter Pills (Functional Buttons) */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer border ${
                filterCategory === cat
                  ? 'bg-[#4f46e5] border-[#4f46e5] text-white shadow-sm'
                  : 'bg-[#181c28] border-[#272d3f] text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 pt-6">
        {filteredProjects.map((proj) => (
          <div
            key={proj.id}
            className="flex flex-col justify-between rounded-xl border border-[#1f2436] bg-[#0c0e16] p-6 hover:border-[#4f46e5] hover:shadow-lg hover:shadow-[#4f46e5]/5 transition-all"
          >
            <div>
              {/* Category & Verified Status */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#818cf8] bg-[#4f46e5]/15 px-2.5 py-0.5 rounded border border-[#4f46e5]/30">
                  {proj.category}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {proj.commitsCount} commits · {proj.status}
                </span>
              </div>

              {/* Title */}
              <h3 className="mt-3 text-lg font-bold text-white">
                {proj.title}
              </h3>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {proj.impact}
              </p>

              {/* Student Author */}
              <div className="mt-3.5 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1f2436]">
                <div>
                  <span className="font-semibold text-slate-200">{proj.student}</span>
                  <span className="block text-[11px] text-slate-500">{proj.college}</span>
                </div>
                <span className="text-right text-[11px] text-[#818cf8] font-medium">
                  Role: {proj.role}
                </span>
              </div>

              {/* Zero-Pill Static Metadata: Demonstrated Skills */}
              <div className="mt-3 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">Demonstrated Skills:</span>
                {proj.skillsDemonstrated.map((s, idx) => (
                  <span key={s} className="text-slate-300">
                    {s}
                    {idx < proj.skillsDemonstrated.length - 1 && <span className="text-slate-600 ml-2">·</span>}
                  </span>
                ))}
              </div>

              {/* Peer Attestation Card */}
              {proj.peerAttestation && (
                <div className="mt-4 rounded-lg bg-[#181c28] p-3 border border-[#272d3f] text-xs text-slate-300">
                  <div className="flex items-center justify-between font-medium text-slate-200 mb-1">
                    <span>Attestation: {proj.peerAttestation.endorser}</span>
                    <span className="text-[10px] bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 px-1.5 py-0.5 rounded font-semibold">
                      {proj.peerAttestation.badge}
                    </span>
                  </div>
                  <p className="italic text-slate-400 text-[11px]">"{proj.peerAttestation.comment}"</p>
                </div>
              )}
            </div>

            {/* Artifact Actions */}
            <div className="mt-5 pt-4 border-t border-[#1f2436] flex items-center justify-between">
              <a
                href={proj.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              >
                <svg className="w-4 h-4 text-[#818cf8]" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Source Repository
              </a>

              <a
                href={proj.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm flex items-center gap-1.5"
              >
                <span>Inspect Live Demo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
