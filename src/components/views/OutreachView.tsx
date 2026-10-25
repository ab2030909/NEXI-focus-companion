"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import { generateAIEmailDraft } from "@/lib/aiService";
import { OutreachContact } from "@/types";
import {
  Send,
  Plus,
  Search,
  Filter,
  Mail,
  Sparkles,
  Calendar,
  Trash2,
  X,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Building,
  UserCheck,
} from "lucide-react";

const STAGES: OutreachContact["status"][] = [
  "Lead",
  "Contacted",
  "In Discussion",
  "Confirmed",
  "Declined",
];

const CATEGORIES: OutreachContact["category"][] = [
  "Speaker",
  "Sponsor",
  "Community Champion",
  "OSS Maintainer",
  "Tech Influencer",
];

export const OutreachView: React.FC = () => {
  const { contacts, addContact, updateContact, deleteContact, showToast } = useDevRel();

  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || "");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [aiAngle, setAiAngle] = useState("");
  const [isRegeneratingDraft, setIsRegeneratingDraft] = useState(false);

  // Form states for new contact
  const [newName, setNewName] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCategory, setNewCategory] = useState<OutreachContact["category"]>("Speaker");
  const [newStatus, setNewStatus] = useState<OutreachContact["status"]>("Lead");
  const [newFollowUp, setNewFollowUp] = useState("2026-11-05");
  const [newNotes, setNewNotes] = useState("");

  const activeContact =
    contacts.find((c) => c.id === selectedContactId) || contacts[0] || null;

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    try {
      const tempContact: OutreachContact = {
        id: `cntc-${Date.now()}`,
        name: newName.trim(),
        organization: newOrg.trim() || "Independent Open Source",
        role: newRole.trim() || "Developer Advocate",
        email: newEmail.trim(),
        category: newCategory,
        status: newStatus,
        followUpDate: newFollowUp,
        notes: newNotes.trim() || "Initial outreach contact added to DevRel pipeline.",
        aiEmailDraft: "",
      };

      const draft = await generateAIEmailDraft(tempContact, undefined, (msg, type) => showToast(msg, type));
      tempContact.aiEmailDraft = draft;

      addContact(tempContact);
      setSelectedContactId(tempContact.id);
      setIsAddModalOpen(false);

      // Reset form
      setNewName("");
      setNewOrg("");
      setNewRole("");
      setNewEmail("");
      setNewNotes("");
    } catch (err: any) {
      showToast(err?.message || "Failed to generate outreach pitch with Groq", "error");
    }
  };

  const handleRegenerateDraft = async () => {
    if (!activeContact) return;
    setIsRegeneratingDraft(true);
    try {
      const newDraft = await generateAIEmailDraft(activeContact, aiAngle.trim(), (msg, type) => showToast(msg, type));
      updateContact({
        ...activeContact,
        aiEmailDraft: newDraft,
      });
      setIsRegeneratingDraft(false);
      setAiAngle("");
    } catch (err: any) {
      setIsRegeneratingDraft(false);
      showToast(err?.message || "Failed to regenerate outreach pitch with Groq", "error");
    }
  };

  const handleCopyEmail = () => {
    if (!activeContact?.aiEmailDraft) return;
    navigator.clipboard.writeText(activeContact.aiEmailDraft);
    setCopiedDraft(true);
    showToast("Email draft copied to clipboard!", "success");
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesCategory = filterCategory === "all" || c.category === filterCategory;
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.organization.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-[#E8E8E5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-[#202124]">Outreach & Ecosystem Pipeline</span>
            <span className="text-[10px] font-semibold bg-[#FFF0EB] text-[#FF6B35] px-2 py-0.5 rounded-full border border-[#FFD4C2]">
              Demo Mode (No Auto-Send)
            </span>
          </div>
          <p className="text-xs text-[#747474]">
            Manage high-touch relationships with speakers, conference sponsors, and OSS maintainers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Pipeline Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E8E5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Quick Filters */}
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              filterStatus === "all"
                ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35]"
                : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:text-[#202124]"
            }`}
          >
            All Stages ({contacts.length})
          </button>
          {STAGES.map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                filterStatus === st
                  ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35]"
                  : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:text-[#202124]"
              }`}
            >
              {st} ({contacts.filter((c) => c.status === st).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#747474]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter contacts..."
              className="w-full bg-[#F7F7F5] text-xs text-[#202124] pl-8 pr-3 py-1.5 rounded-lg border border-[#E8E8E5] focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-lg px-2.5 py-1.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
          >
            <option value="all">All Roles</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two Columns: Contact List & Deep Contact Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Contact List */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredContacts.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-[#E8E8E5] text-center space-y-2">
              <p className="text-xs font-bold text-[#202124]">No contacts yet.</p>
              <p className="text-[11px] text-[#747474]">Add a speaker, sponsor, or community partner to start your pipeline.</p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
            const isSelected = contact.id === activeContact?.id;
            return (
              <div
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? "bg-white border-[#FF6B35] shadow-xs"
                    : "bg-white border-[#E8E8E5] hover:border-[#FFD4C2]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#202124]">{contact.name}</span>
                    <span className="text-[10px] bg-[#F7F7F5] text-[#747474] px-1.5 py-0.5 rounded border border-[#E8E8E5]">
                      {contact.category}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      contact.status === "Confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : contact.status === "In Discussion"
                        ? "bg-amber-100 text-amber-700"
                        : contact.status === "Declined"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {contact.status}
                  </span>
                </div>

                <p className="text-xs text-[#747474] flex items-center gap-1 mb-1">
                  <Building className="w-3 h-3 text-[#747474]" />
                  {contact.role} at {contact.organization}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#747474] mt-2 pt-2 border-t border-[#E8E8E5]">
                  <span className="truncate">{contact.email}</span>
                  <span className="flex items-center gap-1 shrink-0 font-medium text-[#202124]">
                    <Clock className="w-3 h-3 text-[#FF6B35]" />
                    Follow up: {contact.followUpDate}
                  </span>
                </div>
              </div>
            );
          }))}
        </div>

        {/* Right: Contact Profile & AI Email Workspace */}
        <div className="lg:col-span-7">
          {activeContact ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E8E8E5]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[#FF6B35] bg-[#FFF0EB] px-2 py-0.5 rounded-md border border-[#FFD4C2]">
                      {activeContact.category}
                    </span>
                    <span className="text-xs text-[#747474]">Follow up: {activeContact.followUpDate}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#202124]">{activeContact.name}</h3>
                  <p className="text-xs text-[#747474] mt-0.5">
                    {activeContact.role} • {activeContact.organization}
                  </p>
                  <p className="text-xs text-[#FF6B35] font-mono mt-1">{activeContact.email}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status dropdown */}
                  <select
                    value={activeContact.status}
                    onChange={(e) =>
                      updateContact({
                        ...activeContact,
                        status: e.target.value as OutreachContact["status"],
                      })
                    }
                    className="text-xs font-semibold bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-2.5 py-1.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => deleteContact(activeContact.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition"
                    title="Delete contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#202124] uppercase tracking-wider mb-1.5">
                  Advocacy Notes & History
                </label>
                <textarea
                  value={activeContact.notes}
                  onChange={(e) =>
                    updateContact({
                      ...activeContact,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full text-xs text-[#202124] bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-3 focus:outline-none focus:border-[#FF6B35]"
                  placeholder="Record call notes, preferred speaking topics, or sponsorship terms..."
                />
              </div>

              {/* AI-Generated Personalized Email Pitch */}
              <div className="space-y-3 p-4 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
                    AI-Generated Personalized Outreach Email
                  </span>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#FF6B35] bg-white px-2.5 py-1 rounded-lg border border-[#E8E8E5] hover:bg-[#FFF0EB] transition"
                  >
                    {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDraft ? "Copied" : "Copy to Email Client"}</span>
                  </button>
                </div>

                <textarea
                  value={activeContact.aiEmailDraft}
                  onChange={(e) =>
                    updateContact({
                      ...activeContact,
                      aiEmailDraft: e.target.value,
                    })
                  }
                  rows={8}
                  className="w-full text-xs font-sans text-[#202124] bg-white border border-[#E8E8E5] rounded-xl p-3 focus:outline-none focus:border-[#FF6B35] leading-relaxed"
                />

                {/* Regenerate with Custom Angle */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#E8E8E5]/80">
                  <input
                    type="text"
                    value={aiAngle}
                    onChange={(e) => setAiAngle(e.target.value)}
                    placeholder="Custom angle (e.g. podcast guest invite, technical benchmark review)..."
                    className="flex-1 text-xs bg-white border border-[#E8E8E5] rounded-lg px-2.5 py-1.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateDraft}
                    disabled={isRegeneratingDraft}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-lg transition shrink-0 disabled:opacity-50"
                  >
                    {isRegeneratingDraft ? "Generating..." : "Regenerate Pitch"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-[#E8E8E5] text-center space-y-3">
              <Send className="w-8 h-8 text-[#FF6B35] mx-auto" />
              <h3 className="text-sm font-bold text-[#202124]">No contacts yet.</h3>
              <p className="text-xs text-[#747474] max-w-sm mx-auto">
                Add a speaker, sponsor, or community partner to start drafting personalized pitches.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl shadow-xs transition"
              >
                + Add Your First Contact
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8E8E5] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
              <h3 className="text-sm font-bold text-[#202124]">Add Outreach Contact</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#747474] hover:text-[#202124]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Organization</label>
                  <input
                    type="text"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    placeholder="e.g. Vercel, Supabase"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Role</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. Principal Advocate"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as OutreachContact["category"])}
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">Stage</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OutreachContact["status"])}
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  >
                    {STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">Initial Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Key talking points or context..."
                  rows={2}
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#747474] hover:text-[#202124]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
