import { useState, useRef, useEffect, useCallback } from "react";

interface RichBlogContentEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onOpenMediaPicker?: () => void;
}

const FORMAT_OPTIONS = [
  { value: "p", label: "Normal text", tag: "¶", badge: "Normal" },
  { value: "h1", label: "Heading 1", tag: "H1", badge: "Title" },
  { value: "h2", label: "Heading 2", tag: "H2", badge: "Section" },
  { value: "h3", label: "Heading 3", tag: "H3", badge: "Subsection" },
  { value: "h4", label: "Heading 4", tag: "H4", badge: "Minor" },
  { value: "blockquote", label: "Quote / Excerpt", tag: "❝", badge: "Quote" },
  { value: "pre", label: "Code Block", tag: "</>", badge: "Code" },
];

const FONT_OPTIONS = [
  { value: "Default", label: "Default ↕" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Merriweather, serif", label: "Merriweather (Serif)" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Courier New, monospace", label: "Monospace" },
];

const HEIGHT_OPTIONS: Record<"compact" | "default" | "expanded", { label: string; px: string }> = {
  compact: { label: "Compact (440px)", px: "440px" },
  default: { label: "Standard (600px)", px: "600px" },
  expanded: { label: "Expanded (820px)", px: "820px" },
};

export function RichBlogContentEditor({
  content,
  onChange,
  onOpenMediaPicker,
}: RichBlogContentEditorProps) {
  const [mode, setMode] = useState<"visual" | "html" | "preview">("visual");
  const [fontSize, setFontSize] = useState<number>(18);
  const [selectedFormat, setSelectedFormat] = useState<string>("p");
  const [selectedFont, setSelectedFont] = useState<string>("Default");
  const [editorHeight, setEditorHeight] = useState<"compact" | "default" | "expanded">("default");
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [alignMenuOpen, setAlignMenuOpen] = useState(false);
  const [heightMenuOpen, setHeightMenuOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasMoreScroll, setHasMoreScroll] = useState(false);

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Helper to ensure content has paragraph wrappers
  const ensureBlockMarkup = (rawHtml: string): string => {
    if (!rawHtml || !rawHtml.trim()) return "<p><br></p>";
    if (/<(p|h[1-6]|blockquote|pre|div|ul|ol|table)[\s>]/i.test(rawHtml)) {
      return rawHtml;
    }
    return rawHtml
      .split(/\r?\n/)
      .map((line) => (line.trim() ? `<p>${line}</p>` : "<p><br></p>"))
      .join("");
  };

  // Synchronize external content changes into the contentEditable div when in visual mode
  useEffect(() => {
    if (visualEditorRef.current && mode === "visual") {
      const normalized = ensureBlockMarkup(content);
      if (visualEditorRef.current.innerHTML !== normalized) {
        visualEditorRef.current.innerHTML = normalized;
      }
      try {
        document.execCommand("defaultParagraphSeparator", false, "p");
      } catch {
        // Safe fallback
      }
    }
  }, [mode]);

  // Check scroll bounds on content or view change
  const handleScroll = useCallback(() => {
    if (!scrollerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollerRef.current;
    setIsScrolled(scrollTop > 10);
    setHasMoreScroll(scrollTop + clientHeight < scrollHeight - 15);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const updateScrollBounds = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setIsScrolled(scrollTop > 10);
      setHasMoreScroll(scrollHeight > clientHeight + 15);
    };
    updateScrollBounds();
    const timer = setTimeout(updateScrollBounds, 80);
    return () => clearTimeout(timer);
  }, [content, mode, editorHeight]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-editor-dropdown]")) {
        setFormatMenuOpen(false);
        setFontMenuOpen(false);
        setAlignMenuOpen(false);
        setHeightMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
    }
  };

  // Find the nearest block element (p, h1-h6, blockquote, pre) within visualEditorRef
  const getBlockElementAtNode = useCallback((node: Node | null): HTMLElement | null => {
    if (!node || !visualEditorRef.current) return null;
    let curr: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (curr && curr !== visualEditorRef.current) {
      if (curr instanceof HTMLElement) {
        const tag = curr.tagName.toLowerCase();
        if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "div", "li"].includes(tag)) {
          return curr;
        }
      }
      curr = curr.parentNode;
    }
    return null;
  }, []);

  // Update active format state based on cursor position
  const updateActiveFormat = useCallback((range: Range) => {
    const block = getBlockElementAtNode(range.startContainer);
    if (block) {
      const tag = block.tagName.toLowerCase();
      if (["h1", "h2", "h3", "h4", "blockquote", "pre", "p"].includes(tag)) {
        setSelectedFormat(tag);
        return;
      }
    }
    setSelectedFormat("p");
  }, [getBlockElementAtNode]);

  // Selection tracking
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && visualEditorRef.current) {
      const range = sel.getRangeAt(0);
      if (visualEditorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
        updateActiveFormat(range);
      }
    }
  }, [updateActiveFormat]);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current && visualEditorRef.current) {
      visualEditorRef.current.focus();
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  // Listen for selection changes to track active line format
  useEffect(() => {
    const handleSelectionChange = () => {
      if (mode === "visual") {
        saveSelection();
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [mode, saveSelection]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (mode !== "visual") return;
    restoreSelection();
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleVisualInput();
    saveSelection();
  };

  // Convert a single DOM block into newTag cleanly
  const convertSingleCleanBlock = (block: HTMLElement, newTag: string): HTMLElement => {
    const currentTag = block.tagName.toLowerCase();
    if (currentTag === newTag) return block;

    const newElem = document.createElement(newTag);
    while (block.firstChild) {
      newElem.appendChild(block.firstChild);
    }

    if (!newElem.hasChildNodes() || (newElem.childNodes.length === 1 && newElem.firstChild?.nodeName.toLowerCase() === "br")) {
      newElem.innerHTML = "<br>";
    }

    if (block.parentNode) {
      block.parentNode.replaceChild(newElem, block);
    }
    return newElem;
  };

  // Split a block by <br> tags so each line becomes an independent paragraph
  const splitBlockByBr = (block: HTMLElement): HTMLElement[] => {
    const parent = block.parentNode;
    if (!parent) return [block];

    const lines: Node[][] = [[]];
    Array.from(block.childNodes).forEach((child) => {
      if (child.nodeName.toLowerCase() === "br") {
        lines.push([]);
      } else {
        lines[lines.length - 1].push(child);
      }
    });

    if (lines.length <= 1) return [block];

    const createdBlocks: HTMLElement[] = [];
    const frag = document.createDocumentFragment();

    lines.forEach((lineNodes) => {
      const p = document.createElement("p");
      if (lineNodes.length === 0) {
        p.appendChild(document.createElement("br"));
      } else {
        lineNodes.forEach((node) => p.appendChild(node));
      }
      frag.appendChild(p);
      createdBlocks.push(p);
    });

    parent.replaceChild(frag, block);
    return createdBlocks;
  };

  // Place cursor at the end of a given element
  const setCursorToEnd = (elem: HTMLElement) => {
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(elem);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  // Ensure all root children in visualEditorRef are wrapped in block tags
  const normalizeRootBlocks = () => {
    if (!visualEditorRef.current) return;
    const editor = visualEditorRef.current;
    const children = Array.from(editor.childNodes);

    let currentInlineNodes: Node[] = [];
    const wrapInP = (nodes: Node[]) => {
      if (nodes.length === 0) return;
      const p = document.createElement("p");
      nodes.forEach((n) => p.appendChild(n));
      if (p.childNodes.length === 0) {
        p.appendChild(document.createElement("br"));
      }
      editor.insertBefore(p, nodes[0]);
    };

    children.forEach((child) => {
      if (
        child.nodeType === Node.TEXT_NODE ||
        (child instanceof HTMLElement &&
          !["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "div", "ul", "ol", "table"].includes(
            child.tagName.toLowerCase()
          ))
      ) {
        currentInlineNodes.push(child);
      } else {
        if (currentInlineNodes.length > 0) {
          wrapInP(currentInlineNodes);
          currentInlineNodes = [];
        }
      }
    });

    if (currentInlineNodes.length > 0) {
      wrapInP(currentInlineNodes);
    }
  };

  // ─── CRITICAL: Separate Line/Block-Wise Format Function ───
  const applyBlockFormat = (targetTag: string) => {
    if (mode !== "visual" || !visualEditorRef.current) return;

    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      visualEditorRef.current.focus();
      return;
    }

    const range = sel.getRangeAt(0);
    if (!visualEditorRef.current.contains(range.commonAncestorContainer)) {
      visualEditorRef.current.focus();
      return;
    }

    normalizeRootBlocks();

    const editor = visualEditorRef.current;

    const convertBlock = (block: HTMLElement, newTag: string): HTMLElement => {
      const currentTag = block.tagName.toLowerCase();
      const effectiveTag = currentTag === newTag && newTag !== "p" ? "p" : newTag;

      if (block.querySelector("br") && !["pre"].includes(currentTag)) {
        const splitBlocks = splitBlockByBr(block);
        let targetSubBlock = splitBlocks[0];
        for (const sb of splitBlocks) {
          if (sel.containsNode(sb, true)) {
            targetSubBlock = sb;
            break;
          }
        }
        return convertSingleCleanBlock(targetSubBlock, effectiveTag);
      }

      return convertSingleCleanBlock(block, effectiveTag);
    };

    const topBlocks = Array.from(editor.children).filter((child) => {
      if (!(child instanceof HTMLElement)) return false;
      return (
        sel.containsNode(child, true) ||
        child.contains(range.startContainer) ||
        child.contains(range.endContainer)
      );
    }) as HTMLElement[];

    if (topBlocks.length > 0) {
      let lastConverted: HTMLElement | null = null;
      topBlocks.forEach((b) => {
        lastConverted = convertBlock(b, targetTag);
      });
      if (lastConverted) {
        setCursorToEnd(lastConverted);
      }
    } else {
      const fallbackBlock = getBlockElementAtNode(range.startContainer);
      if (fallbackBlock) {
        const converted = convertBlock(fallbackBlock, targetTag);
        setCursorToEnd(converted);
      } else if (editor.children.length === 0) {
        const newBlock = document.createElement(targetTag);
        newBlock.innerHTML = "<br>";
        editor.appendChild(newBlock);
        setCursorToEnd(newBlock);
      }
    }

    handleVisualInput();
    setSelectedFormat(targetTag);
    setFormatMenuOpen(false);
  };

  // Keyboard handler for Enter key in headings
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);

      const currentBlock = getBlockElementAtNode(range.startContainer);
      if (!currentBlock) return;

      const tag = currentBlock.tagName.toLowerCase();

      if (["h1", "h2", "h3", "h4", "blockquote"].includes(tag)) {
        e.preventDefault();

        const testRange = document.createRange();
        testRange.selectNodeContents(currentBlock);
        testRange.setStart(range.endContainer, range.endOffset);
        const remainingText = testRange.toString().trim();

        if (remainingText.length === 0) {
          const newP = document.createElement("p");
          newP.innerHTML = "<br>";
          currentBlock.after(newP);

          const newRange = document.createRange();
          newRange.setStart(newP, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRangeRef.current = newRange.cloneRange();
          setSelectedFormat("p");
          handleVisualInput();
        } else {
          const afterRange = range.cloneRange();
          afterRange.setEndAfter(currentBlock.lastChild || currentBlock);
          const extracted = afterRange.extractContents();

          const newP = document.createElement("p");
          if (extracted.textContent?.trim() || extracted.childNodes.length > 0) {
            newP.appendChild(extracted);
          } else {
            newP.innerHTML = "<br>";
          }
          currentBlock.after(newP);

          const newRange = document.createRange();
          newRange.setStart(newP, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRangeRef.current = newRange.cloneRange();
          setSelectedFormat("p");
          handleVisualInput();
        }
      }
    }
  };

  // Paste handler: splits multi-line text into clean <p> elements
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text || !text.includes("\n")) return;

    e.preventDefault();
    const lines = text.split(/\r?\n/);
    const frag = document.createDocumentFragment();

    lines.forEach((line) => {
      const p = document.createElement("p");
      if (line.trim().length === 0) {
        p.appendChild(document.createElement("br"));
      } else {
        p.textContent = line;
      }
      frag.appendChild(p);
    });

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(frag);
      range.collapse(false);
      handleVisualInput();
    }
  };

  const handleFontFamily = (font: string) => {
    setSelectedFont(font);
    setFontMenuOpen(false);
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
      restoreSelection();
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
    saveSelection();
    const url = prompt("Enter hyperlink URL (e.g. https://...):", "https://");
    if (url) {
      restoreSelection();
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
          const text = await file.text();
          const matches = text.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (matches && matches.length > 0) {
            const cleaned = matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
            parsedHtml = `<p>${cleaned}</p>`;
          } else {
            parsedHtml = `<p>Document imported: ${file.name}</p>`;
          }
        }

        const normalized = ensureBlockMarkup(parsedHtml);
        onChange(normalized);
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = normalized;
        }
      } else {
        const text = await file.text();
        const normalized = ensureBlockMarkup(text);
        onChange(normalized);
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = normalized;
        }
      }
    } catch (err) {
      alert("Could not import file: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const currentFormatObj =
    FORMAT_OPTIONS.find((f) => f.value === selectedFormat) || FORMAT_OPTIONS[0];

  const currentHeightPx = HEIGHT_OPTIONS[editorHeight].px;

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(237,231,218,0.22)] bg-[#ffffff] text-[#1e293b] shadow-2xl flex flex-col">
      {/* ─── STICKY HEADER 1: CONTENT Title + Viewport Height Toggle + Import Word + Pill Tabs ─── */}
      <div className="sticky top-0 lg:top-[4rem] z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-md px-6 py-3.5 shadow-xs transition-shadow">
        <div className="flex items-center gap-3">
          <h2 className="text-[0.82rem] font-bold tracking-wider text-[#64748b] uppercase font-mono">
            CONTENT
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/60 px-2.5 py-0.5 text-[0.7rem] font-semibold text-[#c91d24]">
            Line-Wise Headings
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Text Page Height Scroller Toggle */}
          <div className="relative" data-editor-dropdown>
            <button
              type="button"
              title="Change Editor Scroller View Height"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setHeightMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#334155] shadow-xs hover:border-[#94a3b8] hover:bg-[#f1f5f9] cursor-pointer"
            >
              <span>↕ Scroller:</span>
              <span className="text-[#c91d24] font-mono text-[0.7rem]">
                {editorHeight === "compact" ? "440px" : editorHeight === "expanded" ? "820px" : "600px"}
              </span>
              <span className="text-[0.65rem] text-[#94a3b8]">▼</span>
            </button>

            {heightMenuOpen && (
              <div className="absolute right-0 mt-1 z-40 w-48 rounded-xl border border-[#cbd5e1] bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] border-b border-slate-100 mb-1">
                  Text Page Scroller Height
                </div>
                {(["compact", "default", "expanded"] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setEditorHeight(h);
                      setHeightMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer ${
                      editorHeight === h
                        ? "bg-red-50 text-[#c91d24] font-bold"
                        : "text-[#334155] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    <span>{HEIGHT_OPTIONS[h].label}</span>
                    {editorHeight === h && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

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
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-3.5 py-1.5 text-xs font-semibold text-[#334155] shadow-xs transition-all hover:border-[#94a3b8] hover:bg-[#f1f5f9] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{importing ? "Importing…" : "Import Word"}</span>
          </button>

          {/* Pill Tabs: Visual | HTML | Preview */}
          <div className="flex items-center rounded-full bg-[#f1f5f9] p-1 border border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => setMode("visual")}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                mode === "visual"
                  ? "bg-[#c91d24] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => setMode("html")}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                mode === "html"
                  ? "bg-[#c91d24] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
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

      {/* ─── STICKY HEADER 2: Visual Toolbar (Rows 1 & 2 stay anchored at top!) ─── */}
      {mode === "visual" && (
        <div className="sticky top-[58px] lg:top-[calc(4rem+57px)] z-20 border-b border-[#e2e8f0] bg-[#f8fafc]/95 backdrop-blur-md px-4 py-2.5 space-y-2 select-none shadow-xs">
          {/* Row 1: Undo/Redo, Format Dropdown, Quick Heading Pills, Font, Size, B, I, U, Color, Highlight, Link, Image */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Undo / Redo */}
            <div className="flex items-center border-r border-[#cbd5e1] pr-2 gap-0.5">
              <button
                type="button"
                title="Undo (Ctrl+Z)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand("undo")}
                className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer font-bold"
              >
                ↺
              </button>
              <button
                type="button"
                title="Redo (Ctrl+Y)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand("redo")}
                className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer font-bold"
              >
                ↻
              </button>
            </div>

            {/* Custom Paragraph/Heading Format Dropdown (No focus loss!) */}
            <div className="relative" data-editor-dropdown>
              <button
                type="button"
                title="Change format of current line"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setFormatMenuOpen((prev) => !prev)}
                className="h-7 rounded border border-[#cbd5e1] bg-white px-2.5 text-xs font-medium text-[#334155] hover:border-[#94a3b8] flex items-center gap-1.5 cursor-pointer shadow-xs min-w-[135px] justify-between"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-[#c91d24] font-mono text-[0.7rem] bg-red-50 px-1 rounded">
                    {currentFormatObj.tag}
                  </span>
                  <span>{currentFormatObj.label}</span>
                </span>
                <span className="text-[0.65rem] text-[#94a3b8]">▼</span>
              </button>

              {formatMenuOpen && (
                <div className="absolute left-0 mt-1 z-40 w-52 rounded-xl border border-[#cbd5e1] bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] border-b border-slate-100 mb-1">
                    Apply to Current Line
                  </div>
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyBlockFormat(opt.value)}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        selectedFormat === opt.value
                          ? "bg-red-50 text-[#c91d24] font-bold"
                          : "text-[#334155] hover:bg-[#f1f5f9]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-center font-mono font-bold text-[0.75rem] text-[#64748b]">
                          {opt.tag}
                        </span>
                        <span>{opt.label}</span>
                      </div>
                      <span className="text-[0.65rem] uppercase text-[#94a3b8] font-mono">
                        {opt.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick 1-Click Heading Buttons (Separate Line Text-Wise Edit Option) */}
            <div className="flex items-center gap-1 bg-[#ffffff] rounded-lg border border-[#cbd5e1] p-0.5 shadow-xs">
              <button
                type="button"
                title="Format line as Heading 1 (Large Title)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyBlockFormat("h1")}
                className={`h-6 px-2 rounded text-[0.7rem] font-bold cursor-pointer transition-all ${
                  selectedFormat === "h1"
                    ? "bg-[#c91d24] text-white shadow-xs"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                H1
              </button>
              <button
                type="button"
                title="Format line as Heading 2 (Section Title)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyBlockFormat("h2")}
                className={`h-6 px-2 rounded text-[0.7rem] font-bold cursor-pointer transition-all ${
                  selectedFormat === "h2"
                    ? "bg-[#c91d24] text-white shadow-xs"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                H2
              </button>
              <button
                type="button"
                title="Format line as Heading 3 (Subsection)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyBlockFormat("h3")}
                className={`h-6 px-2 rounded text-[0.7rem] font-bold cursor-pointer transition-all ${
                  selectedFormat === "h3"
                    ? "bg-[#c91d24] text-white shadow-xs"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                H3
              </button>
              <button
                type="button"
                title="Format line as Normal Paragraph (Text)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyBlockFormat("p")}
                className={`h-6 px-2 rounded text-[0.7rem] font-bold cursor-pointer transition-all ${
                  selectedFormat === "p"
                    ? "bg-[#334155] text-white shadow-xs"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                ¶ Text
              </button>
              <button
                type="button"
                title="Format line as Quote / Excerpt"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyBlockFormat("blockquote")}
                className={`h-6 px-2 rounded text-[0.7rem] font-bold cursor-pointer transition-all ${
                  selectedFormat === "blockquote"
                    ? "bg-[#c9992e] text-white shadow-xs"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                ❝ Quote
              </button>
            </div>

            <span className="h-5 w-px bg-[#cbd5e1]" />

            {/* Custom Font Family Dropdown */}
            <div className="relative" data-editor-dropdown>
              <button
                type="button"
                title="Font Family"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setFontMenuOpen((prev) => !prev)}
                className="h-7 rounded border border-[#cbd5e1] bg-white px-2.5 text-xs font-medium text-[#334155] hover:border-[#94a3b8] flex items-center gap-1.5 cursor-pointer shadow-xs min-w-[100px] justify-between"
              >
                <span className="truncate">
                  {FONT_OPTIONS.find((f) => f.value === selectedFont)?.label || "Default ↕"}
                </span>
                <span className="text-[0.65rem] text-[#94a3b8]">▼</span>
              </button>

              {fontMenuOpen && (
                <div className="absolute left-0 mt-1 z-40 w-48 rounded-xl border border-[#cbd5e1] bg-white p-1.5 shadow-xl">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleFontFamily(f.value)}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                        selectedFont === f.value
                          ? "bg-red-50 text-[#c91d24] font-bold"
                          : "text-[#334155] hover:bg-[#f1f5f9]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size Stepper */}
            <div className="flex items-center rounded border border-[#cbd5e1] bg-white h-7 px-1 shadow-xs">
              <button
                type="button"
                title="Decrease font size"
                onMouseDown={(e) => e.preventDefault()}
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
                title="Increase font size"
                onMouseDown={(e) => e.preventDefault()}
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand("bold")}
                className="h-7 w-7 rounded flex items-center justify-center font-bold text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer"
              >
                B
              </button>
              <button
                type="button"
                title="Italic (Ctrl+I)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand("italic")}
                className="h-7 w-7 rounded flex items-center justify-center italic text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer font-serif"
              >
                I
              </button>
              <button
                type="button"
                title="Underline (Ctrl+U)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand("underline")}
                className="h-7 w-7 rounded flex items-center justify-center underline text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer"
              >
                U
              </button>
            </div>

            <span className="h-5 w-px bg-[#cbd5e1]" />

            {/* Text Color */}
            <div className="relative">
              <button
                type="button"
                title="Text Color"
                onMouseDown={saveSelection}
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

            {/* Highlight Color */}
            <div className="relative">
              <button
                type="button"
                title="Highlight Color"
                onMouseDown={saveSelection}
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
                onMouseDown={saveSelection}
                onClick={handleInsertLink}
                className="h-7 w-7 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer text-sm"
              >
                🔗
              </button>
              <button
                type="button"
                title="Insert Image"
                onMouseDown={saveSelection}
                onClick={handleInsertImage}
                className="h-7 w-7 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] active:scale-95 cursor-pointer text-sm"
              >
                🖼
              </button>
            </div>
          </div>

          {/* Row 2: Spacing, Lists, Indent, Clear formatting */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#e2e8f0]/60 text-xs">
            {/* Spacing / Alignment Dropdown */}
            <div className="relative" data-editor-dropdown>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setAlignMenuOpen((prev) => !prev)}
                className="h-7 rounded border border-[#cbd5e1] bg-white px-2.5 text-xs font-medium text-[#334155] hover:border-[#94a3b8] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>≡ Spacing ⬍</span>
              </button>

              {alignMenuOpen && (
                <div className="absolute left-0 mt-1 z-30 w-36 rounded-xl border border-[#cbd5e1] bg-white p-1.5 shadow-lg">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      executeCommand("justifyLeft");
                      setAlignMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#f1f5f9] flex items-center gap-2 cursor-pointer"
                  >
                    <span>⇤</span> Align Left
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      executeCommand("justifyCenter");
                      setAlignMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#f1f5f9] flex items-center gap-2 cursor-pointer"
                  >
                    <span>≡</span> Align Center
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      executeCommand("justifyRight");
                      setAlignMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#f1f5f9] flex items-center gap-2 cursor-pointer"
                  >
                    <span>⇥</span> Align Right
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      executeCommand("justifyFull");
                      setAlignMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-[#f1f5f9] flex items-center gap-2 cursor-pointer"
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("insertUnorderedList")}
              className="h-7 px-2 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] cursor-pointer"
            >
              •≡ List
            </button>

            {/* Numbered List */}
            <button
              type="button"
              title="Numbered List"
              onMouseDown={(e) => e.preventDefault()}
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("outdent")}
              className="h-7 w-7 rounded flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] cursor-pointer font-bold"
            >
              ⇤
            </button>
            <button
              type="button"
              title="Increase Indent"
              onMouseDown={(e) => e.preventDefault()}
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("removeFormat")}
              className="h-7 px-2 rounded flex items-center gap-1 font-semibold text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] cursor-pointer"
            >
              <span>Tx</span>
              <span className="text-[0.65rem] uppercase">Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── DEDICATED DOCUMENT TEXT SCROLLER VIEWPORT ─── */}
      {/* ─── Mode 1: Visual Mode (contentEditable with line-wise block styling & scroller effect) ─── */}
      {mode === "visual" && (
        <div
          className={`editor-scroller-viewport relative bg-[#f8fafc]/50 p-3 sm:p-5 transition-all ${
            isScrolled ? "is-scrolled" : ""
          } ${hasMoreScroll ? "has-more-scroll" : ""}`}
        >
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="editor-text-scroller mx-auto max-w-4xl rounded-xl bg-white shadow-xs border border-[#e2e8f0] p-6 sm:p-10 transition-all"
            style={{
              height: currentHeightPx,
              maxHeight: currentHeightPx,
            }}
          >
            <div
              ref={visualEditorRef}
              contentEditable
              onInput={handleVisualInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              className={`prose max-w-none min-h-[340px] text-[#1e293b] leading-[1.8] focus:outline-none text-[1.05rem]
                [&_h1]:text-[2.2rem] [&_h1]:font-bold [&_h1]:text-[#0f172a] [&_h1]:tracking-tight [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:border-b [&_h1]:border-slate-100 [&_h1]:pb-2
                [&_h2]:text-[1.75rem] [&_h2]:font-bold [&_h2]:text-[#0f172a] [&_h2]:tracking-tight [&_h2]:mt-5 [&_h2]:mb-2.5
                [&_h3]:text-[1.35rem] [&_h3]:font-bold [&_h3]:text-[#1e293b] [&_h3]:mt-4 [&_h3]:mb-2
                [&_h4]:text-[1.12rem] [&_h4]:font-semibold [&_h4]:text-[#334155] [&_h4]:mt-3 [&_h4]:mb-1.5
                [&_p]:my-2.5 [&_p]:leading-[1.8]
                [&_blockquote]:border-l-4 [&_blockquote]:border-[#c91d24] [&_blockquote]:bg-red-50/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:text-[#475569] [&_blockquote]:my-4 [&_blockquote]:rounded-r-lg
                [&_pre]:bg-[#0f172a] [&_pre]:text-[#38bdf8] [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-4 [&_pre]:overflow-x-auto
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                [&_li]:my-1
              `}
              style={{
                fontFamily: selectedFont === "Default" ? "inherit" : selectedFont,
              }}
            />
            {(!content || content === "<p><br></p>" || content === "<br>") && (
              <div
                onClick={() => visualEditorRef.current?.focus()}
                className="pointer-events-none absolute left-10 top-10 italic text-[#94a3b8] text-[1.05rem]"
              >
                Write your blog content here... Use the sticky toolbar above or quick H1, H2, H3 buttons to format lines separately.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Mode 2: HTML Mode (Raw Code Textarea with Scroller Effect) ─── */}
      {mode === "html" && (
        <div className="bg-[#0b1120] p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-[#94a3b8]">
            <span className="font-mono">Raw HTML Source Code (Directly synced to post)</span>
            <span>Paste your custom HTML embed code or raw markup below:</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="<p>Paste or type your HTML code here...</p>"
            style={{
              height: currentHeightPx,
              maxHeight: currentHeightPx,
            }}
            className="editor-text-scroller w-full rounded-xl border border-[#334155] bg-[#030712] p-4 font-mono text-[0.875rem] text-[#38bdf8] focus:border-[#c91d24] focus:outline-none"
          />
        </div>
      )}

      {/* ─── Mode 3: Preview Mode (Exact Frontend Article Look with Scroller Effect) ─── */}
      {mode === "preview" && (
        <div className="bg-[#070b18] p-6 text-[#ede7da]">
          <div
            className="editor-text-scroller mx-auto max-w-3xl rounded-xl border border-white/10 bg-[#0e1630]/60 p-8 shadow-inner"
            style={{
              height: currentHeightPx,
              maxHeight: currentHeightPx,
            }}
          >
            <span className="text-xs uppercase tracking-widest text-[#c9992e] font-semibold block mb-4 border-b border-white/10 pb-2">
              Preview Mode · Live Article Layout
            </span>
            <div
              className="prose prose-invert max-w-none text-[#d7d9e0] text-[1.05rem] leading-[1.8] [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_a]:text-[#c9992e] [&_blockquote]:border-l-2 [&_blockquote]:border-[#c9992e] [&_blockquote]:pl-4 [&_blockquote]:italic"
              dangerouslySetInnerHTML={{ __html: content || "<p className='text-dim italic'>No content written yet.</p>" }}
            />
          </div>
        </div>
      )}

      {/* ─── DOCKED BOTTOM STATUS BAR ─── */}
      <div className="flex flex-wrap items-center justify-between border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-2.5 text-xs text-[#64748b] select-none">
        <div className="flex items-center gap-4">
          <span>Words: {content.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length}</span>
          <span>Characters: {content.replace(/<[^>]*>/g, "").length}</span>
          <span className="hidden md:inline text-[#94a3b8]">|</span>
          <span className="hidden md:inline text-[#94a3b8]">
            Scroller Height: <strong className="text-[#334155] font-mono">{currentHeightPx}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-[#cbd5e1] px-2.5 py-0.5 rounded-md font-mono text-[0.7rem] text-[#334155]">
            <span className="text-[#94a3b8]">Active Line:</span>
            <span className="font-bold text-[#c91d24]">{currentFormatObj.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>Sticky editor active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
