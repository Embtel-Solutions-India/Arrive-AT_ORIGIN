import { useState, useRef, useEffect } from "react";

interface RichBlogContentEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onOpenMediaPicker?: () => void;
}

export function RichBlogContentEditor({
  content,
  onChange,
  onOpenMediaPicker,
}: RichBlogContentEditorProps) {
  const [mode, setMode] = useState<"visual" | "html" | "preview">("visual");
  const [fontSize, setFontSize] = useState<number>(18);
  const [selectedFormat, setSelectedFormat] = useState<string>("p");
  const [selectedFont, setSelectedFont] = useState<string>("Default");
  const [alignMenuOpen, setAlignMenuOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  // Synchronize external content changes into the contentEditable div when in visual mode
  useEffect(() => {
    if (visualEditorRef.current && mode === "visual") {
      if (visualEditorRef.current.innerHTML !== content) {
        visualEditorRef.current.innerHTML = content || "";
      }
    }
  }, [mode]);

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (mode !== "visual") return;
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleVisualInput();
  };

  const handleFormatBlock = (tag: string) => {
    setSelectedFormat(tag);
    if (tag === "p") {
      executeCommand("formatBlock", "<p>");
    } else if (tag.startsWith("h")) {
      executeCommand("formatBlock", `<${tag}>`);
    } else if (tag === "blockquote") {
      executeCommand("formatBlock", "<blockquote>");
    } else if (tag === "pre") {
      executeCommand("formatBlock", "<pre>");
    }
  };

  const handleFontFamily = (font: string) => {
    setSelectedFont(font);
    if (font === "Default") {
      executeCommand("fontName", "inherit");
    } else {
      executeCommand("fontName", font);
    }
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(10, Math.min(72, fontSize + delta));
    setFontSize(newSize);
    if (mode === "visual") {
      // Apply style directly to selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const span = document.createElement("span");
        span.style.fontSize = `${newSize}px`;
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
          handleVisualInput();
        }
      }
    }
  };

  const handleInsertLink = () => {
    const url = prompt("Enter hyperlink URL (e.g. https://...):", "https://");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const handleInsertImage = () => {
    if (onOpenMediaPicker) {
      onOpenMediaPicker();
    } else {
      const url = prompt("Enter Image URL:", "https://");
      if (url) {
        executeCommand("insertImage", url);
      }
    }
  };

  // Import Word (.docx) or HTML file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      if (file.name.endsWith(".docx")) {
        // Attempt docx extraction
        let parsedHtml = "";
        try {
          if (!(window as any).mammoth) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js";
              script.onload = () => resolve();
              script.onerror = () => reject(new Error("CDN load failed"));
              document.head.appendChild(script);
            });
          }
          if ((window as any).mammoth?.convertToHtml) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await (window as any).mammoth.convertToHtml({ arrayBuffer });
            parsedHtml = result.value;
          }
        } catch {
          // Fallback to text reading
        }

        if (!parsedHtml) {
          // Fallback XML parsing of paragraphs
          const text = await file.text();
          const matches = text.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (matches && matches.length > 0) {
            const cleaned = matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
            parsedHtml = `<p>${cleaned}</p>`;
          } else {
            parsedHtml = `<p>Document imported: ${file.name}</p>`;
          }
        }

        onChange(parsedHtml);
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = parsedHtml;
        }
      } else {
        // Direct HTML / text file
        const text = await file.text();
        onChange(text);
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = text;
        }
      }
    } catch (err) {
      alert("Could not import file: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(237,231,218,0.18)] bg-[#ffffff] text-[#1e293b] shadow-xl">
      {/* ─── Top Header: CONTENT Title + Import Word + Pill Tabs ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#ffffff] px-6 py-4">
        <h2 className="text-[0.82rem] font-bold tracking-wider text-[#64748b] uppercase font-mono">
          CONTENT
        </h2>

        <div className="flex items-center gap-3">
          {/* Hidden File Input for Word / HTML import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.html,.htm,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-4 py-1.5 text-xs font-semibold text-[#334155] shadow-sm transition-all hover:border-[#94a3b8] hover:bg-[#f1f5f9] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{importing ? "Importing…" : "Import Word (.docx)"}</span>
          </button>

          {/* Pill Tabs: Visual | HTML | Preview (Active Red Pill as shown in reference) */}
          <div className="flex items-center rounded-full bg-[#f1f5f9] p-1 border border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => {
                setMode("visual");
              }}
              className={`rounded-full px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
                mode === "visual"
                  ? "bg-[#c91d24] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("html");
              }}
              className={`rounded-full px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
                mode === "html"
                  ? "bg-[#c91d24] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("preview");
              }}
              className={`rounded-full px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
                mode === "preview"
                  ? "bg-[#c91d24] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* ─── Visual Toolbar (Displayed when mode === 'visual') ─── */}
      {mode === "visual" && (
        <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 space-y-2 select-none">
          {/* Row 1: Undo/Redo, Formatting, Font, Size, B, I, U, Color, Highlight, Link, Image */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Undo / Redo */}
            <div className="flex items-center border-r border-[#cbd5e1] pr-2 gap-0.5">
              <button
                type="button"
                title="Undo (Ctrl+Z)"
                onClick={() => executeCommand("undo")}
                className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer font-bold"
              >
                ↺
              </button>
              <button
                type="button"
                title="Redo (Ctrl+Y)"
                onClick={() => executeCommand("redo")}
                className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer font-bold"
              >
                ↻
              </button>
            </div>

            {/* Paragraph Format Dropdown */}
            <div className="relative">
              <select
                value={selectedFormat}
                onChange={(e) => handleFormatBlock(e.target.value)}
                className="h-7 rounded border border-[#cbd5e1] bg-white px-2.5 text-xs font-medium text-[#334155] hover:border-[#94a3b8] focus:outline-none cursor-pointer"
              >
                <option value="p">Normal text ⬍</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="h4">Heading 4</option>
                <option value="blockquote">Quote / Excerpt</option>
                <option value="pre">Code Block</option>
              </select>
            </div>

            {/* Font Family Dropdown */}
            <div className="relative">
              <select
                value={selectedFont}
                onChange={(e) => handleFontFamily(e.target.value)}
                className="h-7 rounded border border-[#cbd5e1] bg-white px-2.5 text-xs font-medium text-[#334155] hover:border-[#94a3b8] focus:outline-none cursor-pointer"
              >
                <option value="Default">Default ⬍</option>
                <option value="Inter, sans-serif">Inter</option>
                <option value="Merriweather, serif">Merriweather (Serif)</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Courier New, monospace">Monospace</option>
              </select>
            </div>

            {/* Font Size Stepper: - 18 + */}
            <div className="flex items-center rounded border border-[#cbd5e1] bg-white h-7 px-1">
              <button
                type="button"
                onClick={() => handleFontSizeChange(-1)}
                className="px-1.5 text-xs text-[#64748b] hover:text-[#0f172a] font-bold cursor-pointer"
              >
                −
              </button>
              <span className="px-1 text-xs font-semibold text-[#0f172a] min-w-[20px] text-center">
                {fontSize}
              </span>
              <button
                type="button"
                onClick={() => handleFontSizeChange(1)}
                className="px-1.5 text-xs text-[#64748b] hover:text-[#0f172a] font-bold cursor-pointer"
              >
                +
              </button>
            </div>

            <span className="h-5 w-px bg-[#cbd5e1]" />

            {/* B, I, U */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                title="Bold (Ctrl+B)"
                onClick={() => executeCommand("bold")}
                className="h-7 w-7 rounded flex items-center justify-center font-bold text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer"
              >
                B
              </button>
              <button
                type="button"
                title="Italic (Ctrl+I)"
                onClick={() => executeCommand("italic")}
                className="h-7 w-7 rounded flex items-center justify-center italic text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer font-serif"
              >
                I
              </button>
              <button
                type="button"
                title="Underline (Ctrl+U)"
                onClick={() => executeCommand("underline")}
                className="h-7 w-7 rounded flex items-center justify-center underline text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer"
              >
                U
              </button>
            </div>

            <span className="h-5 w-px bg-[#cbd5e1]" />

            {/* Text Color (A with underline) */}
            <div className="relative">
              <button
                type="button"
                title="Text Color"
                onClick={() => colorInputRef.current?.click()}
                className="h-7 px-1.5 rounded flex items-center gap-0.5 text-[#334155] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <span className="font-bold underline decoration-red-600 decoration-2">A</span>
              </button>
              <input
                ref={colorInputRef}
                type="color"
                onChange={(e) => executeCommand("foreColor", e.target.value)}
                className="sr-only"
              />
            </div>

            {/* Highlight Color (A with background) */}
            <div className="relative">
              <button
                type="button"
                title="Highlight Color"
                onClick={() => highlightInputRef.current?.click()}
                className="h-7 px-1.5 rounded flex items-center gap-0.5 text-[#334155] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <span className="font-bold bg-amber-200 px-1 rounded">A</span>
              </button>
              <input
                ref={highlightInputRef}
                type="color"
                onChange={(e) => executeCommand("hiliteColor", e.target.value)}
                className="sr-only"
              />
            </div>

            <span className="h-5 w-px bg-[#cbd5e1]" />

            {/* Link & Image */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Insert Link"
                onClick={handleInsertLink}
                className="h-7 w-7 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer text-sm"
              >
                🔗
              </button>
              <button
                type="button"
                title="Insert Image"
                onClick={handleInsertImage}
                className="h-7 w-7 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer text-sm"
              >
                🖼
              </button>
            </div>
          </div>

          {/* Row 2: Spacing ⬍, Lists, Indent, Clear formatting */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#e2e8f0]/60 text-xs">
            {/* Spacing / Alignment Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAlignMenuOpen((prev) => !prev)}
                className="h-7 rounded border border-[#cbd5e1] bg-white px-2.5 text-xs font-medium text-[#334155] hover:border-[#94a3b8] flex items-center gap-1.5 cursor-pointer"
              >
                <span>≡ Spacing ⬍</span>
              </button>

              {alignMenuOpen && (
                <div className="absolute left-0 mt-1 z-30 w-36 rounded-xl border border-[#cbd5e1] bg-white p-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      executeCommand("justifyLeft");
                      setAlignMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#f1f5f9] flex items-center gap-2"
                  >
                    <span>⇤</span> Align Left
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      executeCommand("justifyCenter");
                      setAlignMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#f1f5f9] flex items-center gap-2"
                  >
                    <span>≡</span> Align Center
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      executeCommand("justifyRight");
                      setAlignMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#f1f5f9] flex items-center gap-2"
                  >
                    <span>⇥</span> Align Right
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      executeCommand("justifyFull");
                      setAlignMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#f1f5f9] flex items-center gap-2"
                  >
                    <span>☰</span> Justify
                  </button>
                </div>
              )}
            </div>

            <span className="h-5 w-px bg-[#cbd5e1]" />

            {/* Bullet List */}
            <button
              type="button"
              title="Bullet List"
              onClick={() => executeCommand("insertUnorderedList")}
              className="h-7 px-2 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] cursor-pointer"
            >
              •≡ List
            </button>

            {/* Numbered List */}
            <button
              type="button"
              title="Numbered List"
              onClick={() => executeCommand("insertOrderedList")}
              className="h-7 px-2 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] cursor-pointer"
            >
              1≡ List
            </button>

            <span className="h-5 w-px bg-[#cbd5e1]" />

            {/* Indent / Outdent */}
            <button
              type="button"
              title="Decrease Indent"
              onClick={() => executeCommand("outdent")}
              className="h-7 w-7 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] cursor-pointer font-bold"
            >
              ⇤
            </button>
            <button
              type="button"
              title="Increase Indent"
              onClick={() => executeCommand("indent")}
              className="h-7 w-7 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] cursor-pointer font-bold"
            >
              ⇥
            </button>

            <span className="h-5 w-px bg-[#cbd5e1]" />

            {/* Clear Formatting Tx */}
            <button
              type="button"
              title="Clear Formatting"
              onClick={() => executeCommand("removeFormat")}
              className="h-7 px-2 rounded flex items-center gap-1 font-semibold text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] cursor-pointer"
            >
              <span>Tx</span>
              <span className="text-[0.65rem] uppercase">Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Mode 1: Visual Mode (contentEditable) ─── */}
      {mode === "visual" && (
        <div className="relative bg-white p-6 min-h-[420px]">
          <div
            ref={visualEditorRef}
            contentEditable
            onInput={handleVisualInput}
            className="prose max-w-none min-h-[380px] text-[#1e293b] leading-[1.8] focus:outline-none text-[1.05rem]"
            style={{
              fontFamily: selectedFont === "Default" ? "inherit" : selectedFont,
            }}
          />
          {(!content || content === "<p><br></p>" || content === "<br>") && (
            <div
              onClick={() => visualEditorRef.current?.focus()}
              className="pointer-events-none absolute left-6 top-6 italic text-[#94a3b8] text-[1.05rem]"
            >
              Write your blog content here...
            </div>
          )}
        </div>
      )}

      {/* ─── Mode 2: HTML Mode (Raw Code Textarea) ─── */}
      {mode === "html" && (
        <div className="bg-[#0b1120] p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-[#94a3b8]">
            <span className="font-mono">Raw HTML Source Code (Directly synced to post)</span>
            <span>Paste your custom HTML embed code or raw markup below:</span>
          </div>
          <textarea
            rows={18}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="<p>Paste or type your HTML code here...</p>"
            className="w-full rounded-xl border border-[#334155] bg-[#030712] p-4 font-mono text-[0.875rem] text-[#38bdf8] focus:border-[#c91d24] focus:outline-none"
          />
        </div>
      )}

      {/* ─── Mode 3: Preview Mode (Exact Frontend Article Look) ─── */}
      {mode === "preview" && (
        <div className="bg-[#070b18] p-8 text-[#ede7da]">
          <div className="mx-auto max-w-3xl">
            <span className="text-xs uppercase tracking-widest text-[#c9992e] font-semibold block mb-2">
              Preview Mode · Live Article Layout
            </span>
            <div
              className="prose prose-invert max-w-none text-[#d7d9e0] text-[1.05rem] leading-[1.8] [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_a]:text-[#c9992e] [&_blockquote]:border-l-2 [&_blockquote]:border-[#c9992e] [&_blockquote]:pl-4 [&_blockquote]:italic"
              dangerouslySetInnerHTML={{ __html: content || "<p className='text-dim italic'>No content written yet.</p>" }}
            />
          </div>
        </div>
      )}

      {/* ─── Bottom Status Bar ─── */}
      <div className="flex flex-wrap items-center justify-between border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-2.5 text-xs text-[#64748b]">
        <div className="flex items-center gap-4">
          <span>Words: {content.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length}</span>
          <span>Characters: {content.replace(/<[^>]*>/g, "").length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>Rich HTML / Visual synchronized</span>
        </div>
      </div>
    </div>
  );
}
