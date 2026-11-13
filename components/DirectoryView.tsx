'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Scale,
} from 'lucide-react';
import {
  CERT_STATUS_TABLE,
  SPECIALIZATION_TRACKS,
  ESSENTIAL_BOOKS,
  YOUTUBE_CHANNELS,
  TROUBLESHOOTING_GUIDE,
  WEEKLY_SCHEDULE_ROUTINE
} from '@/lib/curriculum-data';

type DirectorySection = 'certs' | 'tracks' | 'books' | 'youtube' | 'schedule' | 'troubleshoot';

export function DirectoryView() {
  const [activeSection, setActiveSection] = useState<DirectorySection>('certs');

  const sections: Array<{ id: DirectorySection; label: string }> = [
    { id: 'certs', label: 'Certs Reality Check' },
    { id: 'tracks', label: '8 Specializations' },
    { id: 'books', label: 'Essential Books' },
    { id: 'youtube', label: 'YouTube Channels' },
    { id: 'schedule', label: 'Weekly Schedule' },
    { id: 'troubleshoot', label: 'Troubleshooting' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="optical-panel rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-cyan-400 mb-1">
            <span>Unabridged Reference Directory</span>
            <span>·</span>
            <span>October 2026 Verified</span>
          </div>
          <h2 className="font-display text-xl font-bold text-white tracking-tight [text-wrap:balance]">
            Resources, Careers &amp; Certification Status
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Verified facts on certificates, 8 specialization tracks, books, channels, and weekly schedules.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="optical-subnav flex gap-1 overflow-x-auto rounded-xl p-1 text-xs font-medium no-scrollbar self-start">
          {sections.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer border ${
                activeSection === tab.id
                  ? 'bg-cyan-500/18 text-cyan-200 border-cyan-400/35 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
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
          <div className="optical-panel rounded-2xl border-amber-400/30 bg-amber-500/8 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>IMPORTANT UPDATE: ISC2 CC FREE EXAM PROGRAM CLOSED</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              The ISC2 Certified in Cybersecurity (CC) free exam program officially closed on <strong>20 May 2026</strong>. Only individuals who already claimed a voucher before that date can use it (valid until <strong>31 December 2026</strong>). For everyone else, the CC exam is now paid (~$199) with an annual $50 maintenance fee. Do not trust outdated blogs claiming it is free.
            </p>
          </div>

          <div className="optical-panel rounded-2xl overflow-hidden font-sans text-xs">
            <div className="p-4 border-b border-white/[0.08] bg-[#040710]/65 flex items-center justify-between">
              <span className="font-display font-semibold text-white text-sm">Certificate Status Breakdown</span>
              <span className="font-mono text-slate-400 text-[11px]">Free vs Paid vs Retired</span>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {CERT_STATUS_TABLE.map((item, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{item.name}</span>
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
                    className={`font-mono text-[11px] font-semibold whitespace-nowrap self-start sm:self-center ${
                      item.status === 'Still Free'
                        ? 'text-emerald-400'
                        : item.status.includes('Closed') || item.status.includes('Retired')
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    · {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="optical-inset rounded-2xl p-5 space-y-2 text-xs text-slate-300">
            <strong className="font-display text-white">Honest Student Advice on Certificates:</strong>
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
            You do not need to choose your lifetime career in Grade 9. Explore two or three paths using beginner labs, then pick one to deepen for 6–8 weeks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SPECIALIZATION_TRACKS.map((track) => (
              <div key={track.id} className="optical-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-base font-semibold text-white">{track.name}</h4>
                  <span className="text-[11px] font-mono text-cyan-400 shrink-0">
                    · {track.role}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{track.whatItDoes}</p>

                <div className="space-y-1.5 pt-2.5 border-t border-white/[0.08] text-xs">
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
              <div key={idx} className="optical-card rounded-2xl p-5 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-cyan-400">{book.level}</span>
                    <span className="text-[11px] font-mono text-slate-500">By {book.author}</span>
                  </div>
                  <h4 className="font-display text-sm font-semibold text-white">{book.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/[0.08]">
                    {book.why}
                  </p>
                </div>
                {book.url && (
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline pt-2 border-t border-white/[0.08]"
                  >
                    <span>Open Book / Site</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: YOUTUBE CHANNELS */}
      {activeSection === 'youtube' && (
        <div className="space-y-4">
          <div className="optical-panel rounded-2xl border-cyan-400/25 bg-cyan-500/8 p-4 text-xs text-cyan-200">
            <strong>Golden YouTube Rule:</strong> Choose 2 or 3 channels and finish their structured playlists. Jumping randomly between 20 channels is the most common cause of tutorial fatigue.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {YOUTUBE_CHANNELS.map((ch, idx) => (
              <div key={idx} className="optical-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <span>YouTube</span>
                    <span>· {ch.level}</span>
                  </div>
                  <div className="font-display font-semibold text-white text-sm">{ch.name}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{ch.focus}</p>
                </div>
                {ch.url && (
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline pt-2 border-t border-white/[0.08]"
                  >
                    <span>Open Channel</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: WEEKLY 10-12H SCHEDULE */}
      {activeSection === 'schedule' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">The Sustainable 10–12 Hour Weekly Schedule</h3>
            <p className="text-xs text-slate-400 mt-1">
              &quot;1.5 hours daily beats 10 hours once a week. Protect your sleep and schoolwork with a repeatable rhythm.&quot;
            </p>
          </div>

          <div className="optical-panel rounded-2xl overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="border-b border-white/[0.08] bg-[#040710]/70 text-slate-400">
                <tr>
                  <th className="p-3.5">Day</th>
                  <th className="p-3.5">Target Time</th>
                  <th className="p-3.5">Focus Session</th>
                  <th className="p-3.5">Daily Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {WEEKLY_SCHEDULE_ROUTINE.map((row) => (
                  <tr key={row.day} className="text-slate-300 hover:bg-white/[0.03] transition-colors">
                    <td className="p-3.5 font-semibold text-cyan-300">{row.day}</td>
                    <td className="p-3.5 text-slate-400 tabular-nums">{row.hours}</td>
                    <td className="p-3.5 font-sans text-xs text-slate-200">{row.focus}</td>
                    <td className="p-3.5 font-sans text-xs text-emerald-400">{row.deliverable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ethics Rule Callout */}
          <div className="optical-panel rounded-2xl border-rose-400/30 bg-rose-500/8 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-rose-300">
              <Scale className="h-4 w-4 text-rose-400" />
              <span>THE GOLDEN RULE OF ETHICS &amp; LAW (NON-NEGOTIABLE)</span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
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

          <div className="grid grid-cols-1 gap-3.5">
            {TROUBLESHOOTING_GUIDE.map((item, idx) => (
              <div key={idx} className="optical-card rounded-2xl p-4 sm:p-5 space-y-2.5">
                <div className="text-xs font-semibold text-rose-400 font-mono">
                  Problem: &quot;{item.problem}&quot;
                </div>
                <div className="optical-inset text-xs text-slate-200 leading-relaxed rounded-xl p-3.5">
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
