"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import { DevRelEvent, EventAgendaItem, EventSpeaker } from "@/types";
import {
  CalendarDays,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  Share2,
  Sparkles,
  Trash2,
  X,
  Copy,
  Check,
  Video,
  ListFilter,
  Calendar,
} from "lucide-react";

export const EventsView: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent, toggleEventTask, showToast } =
    useDevRel();

  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || "");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<DevRelEvent["type"]>("Meetup");
  const [newEventFormat, setNewEventFormat] = useState<DevRelEvent["format"]>("Virtual");
  const [newEventDate, setNewEventDate] = useState("2026-11-20");
  const [newEventTime, setNewEventTime] = useState("06:00 PM PST");
  const [newEventVenue, setNewEventVenue] = useState("Discord Stage / Zoom");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventCap, setNewEventCap] = useState(250);

  // Inline Agenda addition
  const [newAgendaTime, setNewAgendaTime] = useState("");
  const [newAgendaTitle, setNewAgendaTitle] = useState("");
  const [newAgendaSpeaker, setNewAgendaSpeaker] = useState("");

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const created: DevRelEvent = {
      id: `evt-${Date.now()}`,
      title: newEventTitle.trim(),
      type: newEventType,
      format: newEventFormat,
      date: newEventDate,
      time: newEventTime,
      venueOrLink: newEventVenue,
      description: newEventDesc || "Hands-on developer community meetup and interactive hacking.",
      status: "Upcoming",
      registeredCount: 0,
      registrationCap: Number(newEventCap) || 200,
      agenda: [
        { id: `ag-1`, time: "06:00 PM", title: "Welcome & Community Announcements", speaker: "Host", duration: "15m" },
        { id: `ag-2`, time: "06:15 PM", title: "Technical Keynote & Deep Dive", speaker: "Keynote Speaker", duration: "45m" },
        { id: `ag-3`, time: "07:00 PM", title: "Open Q&A and Developer Networking", speaker: "All", duration: "30m" },
      ],
      speakers: [
        { id: `sp-1`, name: "Alex Rivera", role: "DevRel Advocate", company: "DevRelOS", confirmed: true },
      ],
      sponsors: [],
      tasks: [
        { id: `t-1`, title: "Publish RSVP link on Luma / Eventbrite", completed: false },
        { id: `t-2`, title: "Test AV microphone and livestream screen share", completed: false },
        { id: `t-3`, title: "Prepare demo code repository with starter branch", completed: false },
      ],
      promotions: [
        {
          platform: "X / Twitter",
          text: `Join us for ${newEventTitle} on ${newEventDate}! Live coding, technical QA, and community hack challenges. RSVP: lu.ma/devrel-meetup`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    addEvent(created);
    setSelectedEventId(created.id);
    setIsCreateOpen(false);
    setNewEventTitle("");
    setNewEventDesc("");
  };

  const handleAddAgendaItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !newAgendaTitle.trim()) return;

    const newItem: EventAgendaItem = {
      id: `ag-${Date.now()}`,
      time: newAgendaTime || "TBD",
      title: newAgendaTitle.trim(),
      speaker: newAgendaSpeaker.trim() || "Guest Speaker",
      duration: "30m",
    };

    updateEvent({
      ...activeEvent,
      agenda: [...activeEvent.agenda, newItem],
    });

    setNewAgendaTitle("");
    setNewAgendaSpeaker("");
    setNewAgendaTime("");
    showToast("Agenda item added.", "success");
  };

  const handleGenerateRecap = async () => {
    if (!activeEvent) return;
    try {
      const res = await fetch("/api/ai/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTitle: activeEvent.title,
          eventType: activeEvent.type,
          attendeeCount: activeEvent.registeredCount,
          notes: activeEvent.description,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.recap) {
        throw new Error(data.error || "Groq recap generation failed.");
      }
      updateEvent({
        ...activeEvent,
        recapSummary: data.recap,
        status: "Past",
      });
      showToast(`Generated AI recap with Groq (${data.model})!`, "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to generate event recap with Groq", "error");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    showToast("Copied promo draft!", "success");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-12 border border-[#E8E8E5] text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] border border-[#FFD4C2] flex items-center justify-center text-[#FF6B35] mx-auto shadow-xs">
            <CalendarDays className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#202124]">No events created yet.</h3>
            <p className="text-xs text-[#747474] mt-1">
              Plan your first meetup, workshop, or hackathon.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl shadow-xs transition"
            >
              Plan Your First Event
            </button>
          </div>
        </div>

        {/* Create Event Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-[#E8E8E5] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
                <h3 className="text-sm font-bold text-[#202124]">Plan New Developer Event</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-[#747474] hover:text-[#202124]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g. Local Rust & WASM Hack Night, Edge AI Summit"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">Format</label>
                    <select
                      value={newEventFormat}
                      onChange={(e) => setNewEventFormat(e.target.value as DevRelEvent["format"])}
                      className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                    >
                      <option value="Virtual">Virtual</option>
                      <option value="In-Person">In-Person</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">Type</label>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value as DevRelEvent["type"])}
                      className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                    >
                      <option value="Meetup">Meetup</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Conference">Conference</option>
                      <option value="Twitter Space">Twitter Space</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">Date</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">Time</label>
                    <input
                      type="text"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      placeholder="06:00 PM PST"
                      className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Venue or Stream URL</label>
                  <input
                    type="text"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    placeholder="e.g. Moscone Center, SF or Discord Stage"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-3 py-1.5 text-xs text-[#747474] hover:text-[#202124]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="bg-white rounded-2xl p-5 border border-[#E8E8E5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#202124]">Events & Community Management</h2>
          <p className="text-xs text-[#747474]">
            Organize technical meetups, hackathons, conferences, and virtual office hours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[#F7F7F5] rounded-xl p-1 border border-[#E8E8E5]">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === "list"
                  ? "bg-white text-[#202124] shadow-xs"
                  : "text-[#747474] hover:text-[#202124]"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === "timeline"
                  ? "bg-white text-[#202124] shadow-xs"
                  : "text-[#747474] hover:text-[#202124]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Plan Event</span>
          </button>
        </div>
      </div>

      {/* TIMELINE VIEW */}
      {viewMode === "timeline" ? (
        <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-[#202124] mb-4">Event Roadmap & Schedule</h3>
          <div className="relative border-l-2 border-[#FF6B35]/30 ml-4 space-y-8 pl-6">
            {events.map((evt) => (
              <div key={evt.id} className="relative group">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#FF6B35] ring-4 ring-white" />
                <div
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    setViewMode("list");
                  }}
                  className="bg-[#F7F7F5] hover:bg-white p-4 rounded-xl border border-[#E8E8E5] hover:border-[#FF6B35] transition cursor-pointer max-w-xl"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#FF6B35]">{evt.date}</span>
                    <span className="text-xs text-[#747474]">•</span>
                    <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-[#E8E8E5] text-[#202124]">
                      {evt.format} {evt.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#202124]">{evt.title}</h4>
                  <p className="text-xs text-[#747474] mt-1 line-clamp-2">{evt.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#747474]">
                    <span>{evt.venueOrLink}</span>
                    <span className="font-semibold text-[#202124]">
                      {evt.registeredCount} / {evt.registrationCap} RSVPs
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* LIST & DEEP WORKSPACE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Event List Cards */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-bold text-[#202124] uppercase tracking-wider block mb-1">
              Events ({events.length})
            </span>
            <div className="space-y-2.5">
              {events.map((evt) => {
                const isSelected = evt.id === activeEvent?.id;
                const percent = Math.round((evt.registeredCount / evt.registrationCap) * 100);
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-white border-[#FF6B35] shadow-xs"
                        : "bg-white border-[#E8E8E5] hover:border-[#FFD4C2]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-[#FF6B35] bg-[#FFF0EB] px-2 py-0.5 rounded-md border border-[#FFD4C2]">
                        {evt.format} {evt.type}
                      </span>
                      <span className="text-[11px] text-[#747474] font-medium">{evt.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#202124] mb-1">{evt.title}</h4>
                    <p className="text-[11px] text-[#747474] truncate flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3 text-[#747474]" />
                      {evt.venueOrLink}
                    </p>

                    {/* Registration Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#747474]">
                        <span>Registrations</span>
                        <span className="font-semibold text-[#202124]">
                          {evt.registeredCount} / {evt.registrationCap} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F7F7F5] h-1.5 rounded-full overflow-hidden border border-[#E8E8E5]">
                        <div
                          className="bg-[#FF6B35] h-full rounded-full"
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Event Details & Management */}
          <div className="lg:col-span-8">
            {activeEvent ? (
              <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E8E8E5]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-[#FF6B35] bg-[#FFF0EB] px-2 py-0.5 rounded-md border border-[#FFD4C2]">
                        {activeEvent.format} • {activeEvent.type}
                      </span>
                      <span className="text-xs text-[#747474]">Status: {activeEvent.status}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#202124]">{activeEvent.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#747474] mt-1.5">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {activeEvent.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {activeEvent.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {activeEvent.venueOrLink}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteEvent(activeEvent.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition shrink-0"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#202124] leading-relaxed">
                  {activeEvent.description}
                </p>

                {/* Agenda Builder */}
                <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5]">
                  <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-3">
                    Event Agenda ({activeEvent.agenda.length} Sessions)
                  </h4>
                  <div className="space-y-2 mb-4">
                    {activeEvent.agenda.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#E8E8E5] text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#FF6B35] shrink-0">{item.time}</span>
                          <div>
                            <p className="font-semibold text-[#202124]">{item.title}</p>
                            <p className="text-[11px] text-[#747474]">Speaker: {item.speaker}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#747474] bg-[#F7F7F5] px-2 py-0.5 rounded border border-[#E8E8E5]">
                          {item.duration}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add agenda item */}
                  <form onSubmit={handleAddAgendaItem} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#E8E8E5]">
                    <input
                      type="text"
                      value={newAgendaTime}
                      onChange={(e) => setNewAgendaTime(e.target.value)}
                      placeholder="Time (e.g. 02:00 PM)"
                      className="text-xs bg-white border border-[#E8E8E5] rounded-lg px-2.5 py-1.5 text-[#202124] w-28 focus:outline-none focus:border-[#FF6B35]"
                    />
                    <input
                      type="text"
                      value={newAgendaTitle}
                      onChange={(e) => setNewAgendaTitle(e.target.value)}
                      placeholder="Session topic / workshop title..."
                      className="flex-1 text-xs bg-white border border-[#E8E8E5] rounded-lg px-2.5 py-1.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                    />
                    <input
                      type="text"
                      value={newAgendaSpeaker}
                      onChange={(e) => setNewAgendaSpeaker(e.target.value)}
                      placeholder="Speaker name"
                      className="text-xs bg-white border border-[#E8E8E5] rounded-lg px-2.5 py-1.5 text-[#202124] w-32 focus:outline-none focus:border-[#FF6B35]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-lg transition"
                    >
                      Add
                    </button>
                  </form>
                </div>

                {/* Speaker & Sponsor Tracker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Speakers */}
                  <div className="p-4 rounded-xl border border-[#E8E8E5] bg-white">
                    <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-2">
                      Speakers ({activeEvent.speakers.length})
                    </h4>
                    <div className="space-y-2">
                      {activeEvent.speakers.map((sp) => (
                        <div
                          key={sp.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F5] text-xs"
                        >
                          <div>
                            <p className="font-semibold text-[#202124]">{sp.name}</p>
                            <p className="text-[11px] text-[#747474]">{sp.role} ({sp.company})</p>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              sp.confirmed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {sp.confirmed ? "Confirmed" : "Invited"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="p-4 rounded-xl border border-[#E8E8E5] bg-white">
                    <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-2">
                      Event Preparation Tasks
                    </h4>
                    <div className="space-y-2">
                      {activeEvent.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleEventTask(activeEvent.id, task.id)}
                          className="flex items-center gap-2 p-2 rounded-lg bg-[#F7F7F5] text-xs cursor-pointer hover:bg-[#ECECE9] transition"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#FF6B35] shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#747474] shrink-0" />
                          )}
                          <span className={task.completed ? "line-through text-[#747474]" : "text-[#202124]"}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Promo Drafts */}
                {activeEvent.promotions && activeEvent.promotions.length > 0 && (
                  <div className="p-4 rounded-xl border border-[#E8E8E5] bg-[#F7F7F5]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-[#FF6B35]" />
                        Event Promotion Drafts
                      </span>
                    </div>
                    {activeEvent.promotions.map((promo, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-[#E8E8E5] mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-semibold text-[#747474]">
                            {promo.platform}
                          </span>
                          <button
                            onClick={() => handleCopy(promo.text, `promo-${idx}`)}
                            className="flex items-center gap-1 text-[10px] font-medium text-[#FF6B35]"
                          >
                            {copiedIndex === `promo-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedIndex === `promo-${idx}` ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#202124]">{promo.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Event Recap Generator */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Post-Event AI Recap & Community Takeaways
                    </span>
                    <button
                      onClick={handleGenerateRecap}
                      className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                    >
                      Generate AI Recap
                    </button>
                  </div>
                  {activeEvent.recapSummary ? (
                    <div className="mt-2 text-xs text-[#202124] whitespace-pre-wrap bg-white p-3 rounded-lg border border-purple-100">
                      {activeEvent.recapSummary}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#747474]">
                      Click to automatically synthesize speaker notes and attendee feedback into an executive recap post.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8E8E5] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
              <h3 className="text-sm font-bold text-[#202124]">Plan New Developer Event</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#747474] hover:text-[#202124]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Local Rust & WASM Hack Night, Edge AI Summit"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Format</label>
                  <select
                    value={newEventFormat}
                    onChange={(e) => setNewEventFormat(e.target.value as DevRelEvent["format"])}
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  >
                    <option value="Virtual">Virtual</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Type</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as DevRelEvent["type"])}
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  >
                    <option value="Meetup">Meetup</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Conference">Conference</option>
                    <option value="Twitter Space">Twitter Space</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Time</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="06:00 PM PST"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">Venue or Stream URL</label>
                <input
                  type="text"
                  value={newEventVenue}
                  onChange={(e) => setNewEventVenue(e.target.value)}
                  placeholder="e.g. Moscone Center, SF or Discord Stage"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#747474] hover:text-[#202124]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
