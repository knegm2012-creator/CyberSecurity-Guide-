'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Youtube,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  Scale,
  Compass,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import {
  CERT_STATUS_TABLE,
  SPECIALIZATION_TRACKS,
  ESSENTIAL_BOOKS,
  YOUTUBE_CHANNELS,
  TROUBLESHOOTING_GUIDE,
  WEEKLY_SCHEDULE_ROUTINE
} from '@/lib/curriculum-data';

export function DirectoryView() {
  const [activeSection, setActiveSection] = useState<'certs' | 'tracks' | 'books' | 'youtube' | 'schedule' | 'troubleshoot'>('certs');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>UNABRIDGED REFERENCE DIRECTORY</span>
            <span>·</span>
            <span>OCTOBER 2026 VERIFIED</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Resources, Careers & Certification Status</h2>
          <p className="text-xs text-slate-400 mt-1">
            Official facts on certificates, 8 specialization tracks, top books, verified YouTube channels, and study schedules.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs font-semibold no-scrollbar">
          {[
            { id: 'certs', label: 'Certs Reality Check' },
            { id: 'tracks', label: '8 Specializations' },
            { id: 'books', label: 'Essential Books' },
            { id: 'youtube', label: 'YouTube Channels' },
            { id: 'schedule', label: 'Weekly Schedule' },
            { id: 'troubleshoot', label: 'Troubleshooting' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeSection === tab.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: CERTIFICATIONS REALITY CHECK */}
      {activeSection === 'certs' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>IMPORTANT UPDATE: ISC2 CC FREE EXAM PROGRAM CLOSED</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              The ISC2 Certified in Cybersecurity (CC) free exam program officially closed on <strong>20 May 2026</strong>. Only individuals who already claimed a voucher before that date can use it (valid until <strong>31 December 2026</strong>). For everyone else, the CC exam is now paid (~$199) with an annual $50 maintenance fee. Do not trust outdated blogs claiming it is free!
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden font-sans text-xs">
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <span className="font-bold text-white text-sm">Certificate Status Breakdown</span>
              <span className="font-mono text-slate-400 text-[11px]">Free vs Paid vs Retired</span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {CERT_STATUS_TABLE.map((item, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{item.name}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-cyan-400 hover:text-cyan-300 inline-flex items-center"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-slate-400 text-[11px] max-w-2xl">{item.details}</p>
                  </div>

                  <span
                    className={`font-mono text-[11px] px-2.5 py-1 rounded font-semibold whitespace-nowrap self-start sm:self-center ${
                      item.status === 'Still Free'
                        ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                        : item.status.includes('Closed') || item.status.includes('Retired')
                        ? 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                        : 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-2 text-xs text-slate-300">
            <strong className="text-white">Honest Student Advice on Certificates:</strong>
            <p className="leading-relaxed">
              Free badges and completion certificates prove that you tried and finished something. They are great for your CV and confidence. However, none of the free ones is an independently proctored professional exam like Security+. Do not stop at collecting badges: <strong>employers and universities value real GitHub code and documented projects 10x more than certificates.</strong>
            </p>
          </div>
        </div>
      )}

      {/* SECTION 2: 8 SPECIALIZATION TRACKS */}
      {activeSection === 'tracks' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            You do not need to choose your lifetime career in Grade 9! Explore two or three paths using beginner labs, then pick one to deepen for 6-8 weeks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SPECIALIZATION_TRACKS.map((track) => (
              <div key={track.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">{track.name}</h4>
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                    {track.role}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{track.whatItDoes}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="font-semibold text-slate-400">Foundations Needed: </span>
                    <span className="text-slate-200">{track.foundations}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-400">Recommended Proof: </span>
                    <span className="text-emerald-200">{track.beginnerProof}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: ESSENTIAL BOOKS */}
      {activeSection === 'books' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Classic textbooks and foundational guides recommended by computer science faculties.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ESSENTIAL_BOOKS.map((book, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{book.title}</h4>
                  <span className="text-[10px] font-mono text-cyan-400 border border-cyan-900/60 px-2 py-0.5 rounded">
                    {book.level}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">By {book.author}</div>
                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                  {book.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: YOUTUBE CHANNELS */}
      {activeSection === 'youtube' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4 text-xs text-cyan-300">
            <strong>Golden YouTube Rule:</strong> Choose 2 or 3 channels and finish their structured playlists. Jumping randomly between 20 channels is the most common cause of tutorial fatigue!
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {YOUTUBE_CHANNELS.map((ch, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{ch.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{ch.level}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ch.focus}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: WEEKLY 10-12H SCHEDULE */}
      {activeSection === 'schedule' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">The Sustainable 10-12 Hour Weekly Schedule</h3>
            <p className="text-xs text-slate-400 mt-1">
              &quot;1.5 hours daily beats 10 hours once a week. Protect your sleep and schoolwork with a repeatable rhythm.&quot;
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="p-3">Day</th>
                  <th className="p-3">Target Time</th>
                  <th className="p-3">Focus Session</th>
                  <th className="p-3">Daily Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {WEEKLY_SCHEDULE_ROUTINE.map((row) => (
                  <tr key={row.day} className="text-slate-300 hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-cyan-400">{row.day}</td>
                    <td className="p-3 text-slate-400">{row.hours}</td>
                    <td className="p-3 font-sans text-xs text-slate-200">{row.focus}</td>
                    <td className="p-3 font-sans text-xs text-emerald-400">{row.deliverable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ethics Rule Callout */}
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400">
              <Scale className="h-4 w-4" />
              <span>THE GOLDEN RULE OF ETHICS & LAW (NON-NEGOTIABLE)</span>
            </div>
            <p className="text-xs text-red-200/90 leading-relaxed">
              Only test systems that you own or where you have clear written permission. Attacking a real website, school network, game server, or friend’s account without permission is a serious crime in most countries and will permanently destroy your future engineering career. Practice only on designated legal platforms (OverTheWire, TryHackMe, PortSwigger, picoCTF) or within your own isolated virtual machines.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 6: TROUBLESHOOTING */}
      {activeSection === 'troubleshoot' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            What to do when you feel stuck, overwhelmed, or frustrated. Solutions from Section 14 of the student guide.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {TROUBLESHOOTING_GUIDE.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
                <div className="text-xs font-bold text-rose-400 font-mono">
                  Problem: &quot;{item.problem}&quot;
                </div>
                <div className="text-xs text-slate-200 leading-relaxed pl-2 border-l-2 border-cyan-500">
                  {item.solution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
