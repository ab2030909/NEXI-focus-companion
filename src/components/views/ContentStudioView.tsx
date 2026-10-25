"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import { generateAIContent } from "@/lib/aiService";
import { ContentDraft, ContentFormat } from "@/types";
import {
  FileCode2,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Save,
  Trash2,
  RotateCcw,
  Eye,
  Edit3,
  Search,
  Filter,
  Layers,
  Code2,
  Tag,
} from "lucide-react";

const CONTENT_TYPES: { id: ContentFormat; label: string; icon: string }[] = [
  { id: "technical-tutorial", label: "Technical Tutorial", icon: "📖" },
  { id: "linkedin-post", label: "LinkedIn Post", icon: "💼" },
  { id: "x-post", label: "X Thread / Post", icon: "🐦" },
  { id: "product-launch", label: "Product Launch", icon: "🚀" },
  { id: "developer-docs", label: "Developer Docs", icon: "📑" },
  { id: "blog-article", label: "Blog Article", icon: "✍️" },
  { id: "workshop-outline", label: "Workshop Outline", icon: "🎯" },
  { id: "event-description", label: "Event Description", icon: "📅" },
];

export const ContentStudioView: React.FC = () => {
  const {
    contentDrafts,
    addContentDraft,
    updateContentDraft,
    deleteContentDraft,
    campaigns,
    showToast,
  } = useDevRel();

  // Active Draft
  const [selectedDraftId, setSelectedDraftId] = useState<string>(
    contentDrafts[0]?.id || ""
  );

  const activeDraft =
    contentDrafts.find((d) => d.id === selectedDraftId) || contentDrafts[0] || null;

  // Generator form states
  const [selectedType, setSelectedType] = useState<ContentFormat>("technical-tutorial");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("Fullstack TypeScript & Rust Developers");
  const [tone, setTone] = useState("Authoritative, Code-First, Architectural");
  const [length, setLength] = useState<"Short" | "Medium" | "Comprehensive">("Comprehensive");
  const [codeLanguage, setCodeLanguage] = useState("TypeScript & Rust");
  const [isGenerating, setIsGenerating] = useState(false);

  // Editor states
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [editedContent, setEditedContent] = useState(activeDraft?.content || "");
  const [editedTitle, setEditedTitle] = useState(activeDraft?.title || "");
  const [isCopied, setIsCopied] = useState(false);
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [librarySearch, setLibrarySearch] = useState("");

  // Update editor state when active draft changes
  React.useEffect(() => {
    if (activeDraft) {
      setEditedContent(activeDraft.content);
      setEditedTitle(activeDraft.title);
    }
  }, [activeDraft]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const generatedMarkdown = await generateAIContent({
        type: selectedType,
        topic: topic.trim(),
        audience,
        tone,
        length,
        codeLanguage,
        onAlert: (msg, type) => showToast(msg, type),
      });

      const newDraft: ContentDraft = {
        id: `cnt-${Date.now()}`,
        title: topic.trim(),
        type: selectedType,
        topic: topic.trim(),
        audience,
        tone,
        length,
        codeLanguage,
        content: generatedMarkdown,
        status: "Draft",
        tags: [selectedType.replace("-", ""), codeLanguage.split(" ")[0]],
        linkedCampaignId: campaigns[0]?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addContentDraft(newDraft);
      setSelectedDraftId(newDraft.id);
      setIsGenerating(false);
      setTopic("");
    } catch (err: any) {
      setIsGenerating(false);
      showToast(err?.message || "Failed to generate content with Groq", "error");
    }
  };

  const handleSaveEdits = () => {
    if (!activeDraft) return;
    updateContentDraft({
      ...activeDraft,
      title: editedTitle,
      content: editedContent,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setIsCopied(true);
    showToast("Markdown copied to clipboard!", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRevise = (action: string) => {
    if (!editedContent) return;
    if (action === "shorter") {
      setEditedContent(
        `> **Revised for Brevity**\n\n` +
          editedContent
            .split("\n\n")
            .filter((_, i) => i % 2 === 0)
            .join("\n\n")
      );
      showToast("Condensed content structure.", "info");
    } else if (action === "code") {
      setEditedContent(
        editedContent +
          `\n\n## Bonus Benchmark Harness (${codeLanguage || "Rust"})\n\n\`\`\`rust\n// Criterion performance benchmark suite\nuse criterion::{black_box, criterion_group, criterion_main, Criterion};\n\npub fn benchmark_throughput(c: &mut Criterion) {\n    c.bench_function("vector_dot_product", |b| {\n        b.iter(|| black_box(calculate_dot(&VEC_A, &VEC_B)))\n    });\n}\n\`\`\`\n`
      );
      showToast("Added code benchmark harness.", "info");
    } else if (action === "custom" && revisionPrompt.trim()) {
      setEditedContent(
        editedContent + `\n\n> Note (${revisionPrompt}): Optimized for developer clarity and production scale.\n`
      );
      setRevisionPrompt("");
      showToast("Applied revision instruction.", "info");
    }
  };

  const filteredDrafts = contentDrafts.filter((d) => {
    const matchesType = filterType === "all" || d.type === filterType;
    const matchesSearch =
      d.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      d.topic.toLowerCase().includes(librarySearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Content Generator Control Panel */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] flex items-center justify-center text-[#FF6B35]">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202124]">Developer Content Studio</h2>
              <p className="text-xs text-[#747474]">
                Generate code tutorials, technical threads, launch posts, and documentation with AI.
              </p>
            </div>
          </div>
        </div>

        {/* Content Type Pill Selectors */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#202124] mb-2">
            Select Content Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {CONTENT_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center border transition ${
                    isSelected
                      ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-bold shadow-xs"
                      : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:bg-white hover:text-[#202124]"
                  }`}
                >
                  <span className="text-base mb-1">{type.icon}</span>
                  <span className="text-[11px] leading-tight truncate w-full">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Parameters */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                Topic or Headline *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Zero-Copy FlatBuffers Deserialization in Rust, Why We Replaced Redis with Edge WASM"
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] placeholder:text-[#747474] focus:outline-none focus:border-[#FF6B35] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                Primary Language / SDK
              </label>
              <input
                type="text"
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                placeholder="e.g. TypeScript, Rust, Python, Go"
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                Target Audience
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Systems Engineers, Fullstack Leads"
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                Editorial Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35] transition"
              >
                <option value="Authoritative, Code-First, Architectural">Authoritative & Architectural</option>
                <option value="Concise, Punchy, Hacker News Style">Concise & Hacker News Style</option>
                <option value="Educational & Welcoming">Educational & Step-by-Step</option>
                <option value="Direct Changelog & Release Notes">Technical Changelog</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                Desired Length
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as typeof length)}
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35] transition"
              >
                <option value="Short">Short (Bite-sized / Social / 200 words)</option>
                <option value="Medium">Medium (Guide / 600 words)</option>
                <option value="Comprehensive">Comprehensive (Full Tutorial / 1,200 words)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Drafting Technical Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Content</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Main Studio Area: Content Library Sidebar + Deep Interactive Markdown Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drafts Library */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-[#E8E8E5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#202124] uppercase tracking-wider">
                Drafts Library ({contentDrafts.length})
              </span>
            </div>

            {/* Filter & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#747474]" />
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Filter drafts..."
                  className="w-full bg-[#F7F7F5] text-xs text-[#202124] pl-8 pr-3 py-1.5 rounded-lg border border-[#E8E8E5] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-lg px-2.5 py-1.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
              >
                <option value="all">All Formats</option>
                {CONTENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Draft list */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pt-1">
              {filteredDrafts.length === 0 ? (
                <div className="p-4 bg-[#F7F7F5] rounded-xl text-center space-y-1">
                  <p className="text-xs font-bold text-[#202124]">No content drafts yet.</p>
                  <p className="text-[11px] text-[#747474]">Generate your first tutorial, launch post, or developer guide above.</p>
                </div>
              ) : (
                filteredDrafts.map((draft) => {
                const isSelected = draft.id === activeDraft?.id;
                return (
                  <div
                    key={draft.id}
                    onClick={() => setSelectedDraftId(draft.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-[#FFF0EB]/50 border-[#FF6B35] shadow-xs"
                        : "bg-[#F7F7F5] border-[#E8E8E5] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider">
                        {draft.type.replace("-", " ")}
                      </span>
                      <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-[#E8E8E5] text-[#747474]">
                        {draft.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#202124] line-clamp-1">
                      {draft.title}
                    </h4>
                    <p className="text-[11px] text-[#747474] line-clamp-2 mt-0.5">
                      {draft.topic}
                    </p>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Editor / Preview */}
        <div className="lg:col-span-8">
          {activeDraft ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs space-y-4">
              {/* Editor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E8E5]">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-base font-bold text-[#202124] bg-transparent border-b border-transparent hover:border-[#E8E8E5] focus:border-[#FF6B35] focus:outline-none w-full transition"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-[#747474] font-medium">
                      Format: {activeDraft.type.replace("-", " ")}
                    </span>
                    <span className="text-xs text-[#747474]">•</span>
                    <span className="text-[11px] text-[#747474]">
                      Audience: {activeDraft.audience}
                    </span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Mode switch */}
                  <div className="flex items-center bg-[#F7F7F5] rounded-xl p-1 border border-[#E8E8E5]">
                    <button
                      type="button"
                      onClick={() => setEditorMode("edit")}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        editorMode === "edit"
                          ? "bg-white text-[#202124] shadow-xs"
                          : "text-[#747474] hover:text-[#202124]"
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode("preview")}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        editorMode === "preview"
                          ? "bg-white text-[#202124] shadow-xs"
                          : "text-[#747474] hover:text-[#202124]"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#202124] bg-[#F7F7F5] hover:bg-[#ECECE9] rounded-xl border border-[#E8E8E5] transition"
                    title="Copy Markdown"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>

                  {/* Save Draft */}
                  <button
                    onClick={handleSaveEdits}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl transition"
                    title="Save Draft"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>

                  {/* Delete Draft */}
                  <button
                    onClick={() => deleteContentDraft(activeDraft.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Editor Workspace */}
              {editorMode === "edit" ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={18}
                  className="w-full text-xs font-mono text-[#202124] bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-4 focus:outline-none focus:border-[#FF6B35] leading-relaxed resize-y"
                  placeholder="Write or edit your technical markdown here..."
                />
              ) : (
                <div className="w-full bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-6 prose prose-sm max-w-none min-h-[400px] overflow-y-auto">
                  <pre className="text-xs text-[#202124] whitespace-pre-wrap font-sans leading-relaxed">
                    {editedContent}
                  </pre>
                </div>
              )}

              {/* AI Quick Revision Bar */}
              <div className="pt-3 border-t border-[#E8E8E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-xs font-semibold text-[#202124]">Revise with AI:</span>
                  <button
                    type="button"
                    onClick={() => handleRevise("shorter")}
                    className="text-[11px] font-medium bg-[#F7F7F5] text-[#202124] hover:bg-white px-2.5 py-1 rounded-lg border border-[#E8E8E5] transition"
                  >
                    Make Concise
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevise("code")}
                    className="text-[11px] font-medium bg-[#F7F7F5] text-[#202124] hover:bg-white px-2.5 py-1 rounded-lg border border-[#E8E8E5] transition"
                  >
                    + Benchmark Code
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={revisionPrompt}
                    onChange={(e) => setRevisionPrompt(e.target.value)}
                    placeholder="Custom instruction (e.g. Add Rust FFI example)..."
                    className="text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-lg px-2.5 py-1 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRevise("custom")}
                    className="text-xs font-semibold text-white bg-[#202124] hover:bg-[#333] px-3 py-1 rounded-lg transition shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-[#E8E8E5] text-center space-y-3">
              <FileCode2 className="w-8 h-8 text-[#FF6B35] mx-auto" />
              <h3 className="text-sm font-bold text-[#202124]">No content drafts yet.</h3>
              <p className="text-xs text-[#747474] max-w-sm mx-auto">
                Generate your first tutorial, launch post, or developer guide using the studio generator above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
