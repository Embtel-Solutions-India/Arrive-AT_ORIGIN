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
  { value: "Default", label: "Default Font ↕" },
  { value: "Inter, sans-serif", label: "Inter (Modern)" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia (Serif)" },
  { value: "Merriweather, serif", label: "Merriweather" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Courier New, monospace", label: "Courier (Monospace)" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
  { value: "Verdana, sans-serif", label: "Verdana" },
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const TEXT_COLORS = [
  { name: "Blog Vellum (Heading)", value: "#ede7da" },
  { name: "Pure White", value: "#ffffff" },
  { name: "Blog Body (Silver-Grey)", value: "#D7D9E0" },
  { name: "Luxury Gold", value: "#c9992e" },
  { name: "Halo Gold", value: "#e8ce8c" },
  { name: "Brand Red", value: "#c91d24" },
  { name: "Sky Cyan", value: "#38bdf8" },
  { name: "Emerald", value: "#10b981" },
  { name: "Purple", value: "#a855f7" },
  { name: "Slate / Dark", value: "#0f172a" },
];

const HIGHLIGHT_COLORS = [
  { name: "Gold Halo", value: "rgba(201, 153, 46, 0.35)" },
  { name: "Cyan", value: "rgba(56, 189, 248, 0.3)" },
  { name: "Emerald", value: "rgba(16, 185, 129, 0.3)" },
  { name: "Rose", value: "rgba(244, 63, 94, 0.3)" },
  { name: "Yellow", value: "rgba(254, 240, 138, 0.4)" },
  { name: "None", value: "transparent" },
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
  const [canvasTheme, setCanvasTheme] = useState<"dark" | "light">(() => {
    try {
      const saved = localStorage.getItem("sb_blog_editor_canvas_theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // ignore
    }
    return "dark"; // Default to Live Blog Dark background (#070b18)
  });

  const toggleCanvasTheme = () => {
    setCanvasTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("sb_blog_editor_canvas_theme", next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Dropdown States
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [heightMenuOpen, setHeightMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);

  const [importing, setImporting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasMoreScroll, setHasMoreScroll] = useState(false);

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const isEditingRef = useRef(false);

  // Helper to ensure content has paragraph wrappers and unwrap any accidental global wrappers
  const ensureBlockMarkup = (rawHtml: string): string => {
    if (!rawHtml || !rawHtml.trim()) return "<p><br></p>";

    let cleaned = rawHtml.trim();

    // 1. Unwrap global <font> or <span style="font-family..."> wrappers if they wrap multiple blocks
    cleaned = cleaned.replace(/^<font[^>]*>([\s\S]*)<\/font>$/i, "$1");

    // 2. Unwrap accidental global <h1><p>... or <h2><p>... wrappers
    cleaned = cleaned.replace(/^<h[1-6][^>]*>(\s*<(?:p|div)[\s\S]*<\/(?:p|div)>\s*)<\/h[1-6]>$/i, "$1");

    // 3. If it already has block tags, return cleaned
    if (/<(p|h[1-6]|blockquote|pre|div|ul|ol|table)[\s>]/i.test(cleaned)) {
      return cleaned;
    }

    // 4. If plain text or separated by newlines, split into clean <p> blocks
    return cleaned
      .split(/\r?\n/)
      .map((line) => (line.trim() ? `<p>${line}</p>` : "<p><br></p>"))
      .join("");
  };

  // Synchronize external content changes into the contentEditable div when in visual mode
  useEffect(() => {
    if (visualEditorRef.current && mode === "visual") {
      if (!isEditingRef.current) {
        const normalized = ensureBlockMarkup(content);
        if (visualEditorRef.current.innerHTML !== normalized) {
          visualEditorRef.current.innerHTML = normalized;
        }
      }
      try {
        document.execCommand("defaultParagraphSeparator", false, "p");
      } catch {
        // Safe fallback
      }
    }
  }, [mode, content]);

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
        setColorMenuOpen(false);
        setHighlightMenuOpen(false);
        setHeightMenuOpen(false);
        setTableMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      isEditingRef.current = true;
      const html = visualEditorRef.current.innerHTML;
      onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
      setTimeout(() => {
        isEditingRef.current = false;
      }, 50);
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
      }
    } else {
      setSelectedFormat("p");
    }

    // Detect font & font-size of text at cursor
    const node = range.startContainer;
    const parentElem = node instanceof HTMLElement ? node : node.parentElement;
    if (parentElem) {
      const inlineFont = parentElem.style.fontFamily;
      if (inlineFont) {
        const found = FONT_OPTIONS.find((f) =>
          f.value.toLowerCase().includes(inlineFont.toLowerCase()) ||
          inlineFont.toLowerCase().includes(f.value.toLowerCase())
        );
        if (found) {
          setSelectedFont(found.value);
        }
      } else {
        setSelectedFont("Default");
      }
      if (parentElem.style.fontSize) {
        const sz = parseInt(parentElem.style.fontSize, 10);
        if (!isNaN(sz)) setFontSize(sz);
      }
    }
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

    // 1. Single line format: When cursor is on a line without multi-line selection
    if (range.collapsed) {
      let targetBlock = getBlockElementAtNode(range.startContainer);
      if (!targetBlock && editor.children.length > 0) {
        const idx = Math.min(range.startOffset, editor.children.length - 1);
        targetBlock = editor.children[idx] as HTMLElement;
      }
      if (targetBlock) {
        const converted = convertBlock(targetBlock, targetTag);
        setCursorToEnd(converted);
      } else {
        const newBlock = document.createElement(targetTag);
        newBlock.innerHTML = "<br>";
        editor.appendChild(newBlock);
        setCursorToEnd(newBlock);
      }
      handleVisualInput();
      setSelectedFormat(targetTag);
      setFormatMenuOpen(false);
      return;
    }

    // 2. Multi-line format: ONLY when user highlighted across multiple blocks
    const selectedBlocks = Array.from(editor.children).filter((child) => {
      if (!(child instanceof HTMLElement)) return false;
      return range.intersectsNode(child);
    }) as HTMLElement[];

    if (selectedBlocks.length > 0) {
      let lastConverted: HTMLElement | null = null;
      selectedBlocks.forEach((b) => {
        lastConverted = convertBlock(b, targetTag);
      });
      if (lastConverted) {
        setCursorToEnd(lastConverted);
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

  // Helper to expand collapsed cursor range to the entire word at the cursor
  const expandRangeToWord = (range: Range): Range | null => {
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;
    const text = node.textContent || "";
    if (text.length === 0) return null;

    let start = range.startOffset;
    let end = range.startOffset;

    // Adjust if cursor is directly after a word
    if (start > 0 && (start === text.length || /\s/.test(text[start])) && !/\s/.test(text[start - 1])) {
      start--;
      end = start + 1;
    }

    if (/\s/.test(text[start])) return null;

    while (start > 0 && !/\s/.test(text[start - 1])) {
      start--;
    }
    while (end < text.length && !/\s/.test(text[end])) {
      end++;
    }

    if (start < end) {
      const newRange = document.createRange();
      newRange.setStart(node, start);
      newRange.setEnd(node, end);
      return newRange;
    }
    return null;
  };

  const findParentSpanWithStyle = (node: Node | null, styleProp: "fontFamily" | "fontSize"): HTMLElement | null => {
    if (!node || !visualEditorRef.current) return null;
    let curr: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (curr && curr !== visualEditorRef.current) {
      if (curr instanceof HTMLElement && curr.tagName.toLowerCase() === "span" && curr.style[styleProp]) {
        return curr;
      }
      curr = curr.parentNode;
    }
    return null;
  };

  // Format single word or selected text font family
  const handleFontFamily = (font: string) => {
    setFontMenuOpen(false);
    if (mode !== "visual" || !visualEditorRef.current) return;

    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let range = sel.getRangeAt(0);

    // If cursor is on a word without dragging, expand selection to that word
    if (range.collapsed) {
      const parentSpan = findParentSpanWithStyle(range.startContainer, "fontFamily");
      if (parentSpan) {
        parentSpan.style.fontFamily = font === "Default" ? "inherit" : font;
        handleVisualInput();
        setSelectedFont(font);
        return;
      }
      const expanded = expandRangeToWord(range);
      if (expanded) {
        range = expanded;
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    const fontFamilyValue = font === "Default" ? "inherit" : font;

    if (!range.collapsed) {
      const span = document.createElement("span");
      span.style.fontFamily = fontFamilyValue;
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);

      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
      handleVisualInput();
    }

    setSelectedFont(font);
  };

  // Format single word or selected text font size
  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(10, Math.min(72, fontSize + delta));
    setFontSize(newSize);
    if (mode !== "visual" || !visualEditorRef.current) return;

    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let range = sel.getRangeAt(0);

    if (range.collapsed) {
      const parentSpan = findParentSpanWithStyle(range.startContainer, "fontSize");
      if (parentSpan) {
        parentSpan.style.fontSize = `${newSize}px`;
        handleVisualInput();
        return;
      }
      const expanded = expandRangeToWord(range);
      if (expanded) {
        range = expanded;
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    if (!range.collapsed) {
      const span = document.createElement("span");
      span.style.fontSize = `${newSize}px`;
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);

      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
      handleVisualInput();
    }
  };

  // Format single word or selected text color
  const applyColor = (color: string) => {
    setColorMenuOpen(false);
    if (mode !== "visual" || !visualEditorRef.current) return;
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let range = sel.getRangeAt(0);

    if (range.collapsed) {
      const expanded = expandRangeToWord(range);
      if (expanded) {
        range = expanded;
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    document.execCommand("foreColor", false, color);
    handleVisualInput();
    saveSelection();
  };

  // Format single word or selected text highlight
  const applyHighlight = (color: string) => {
    setHighlightMenuOpen(false);
    if (mode !== "visual" || !visualEditorRef.current) return;
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let range = sel.getRangeAt(0);

    if (range.collapsed) {
      const expanded = expandRangeToWord(range);
      if (expanded) {
        range = expanded;
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    document.execCommand("hiliteColor", false, color);
    handleVisualInput();
    saveSelection();
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

  // Insert Table (Word style)
  const handleInsertTable = (rows = 3, cols = 3) => {
    restoreSelection();
    setTableMenuOpen(false);
    let tableHtml = `<table style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #cbd5e1;"><thead><tr style="background-color:#f8fafc;">`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="border:1px solid #cbd5e1; padding:8px 12px; text-align:left; font-weight:bold; color:#1e293b;">Header ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border:1px solid #cbd5e1; padding:8px 12px; color:#334155;">Data ${r}.${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;
    executeCommand("insertHTML", tableHtml);
  };

  // Insert Callout Box (Word / Notion style note)
  const handleInsertCallout = () => {
    restoreSelection();
    const calloutHtml = `
      <div style="margin:16px 0; padding:14px 18px; border-radius:12px; border-left:4px solid #c91d24; background-color:#fef2f2; color:#991b1b; display:flex; gap:12px; align-items:flex-start;">
        <span style="font-size:1.2rem; line-height:1;">💡</span>
        <div style="flex:1;"><strong>Note:</strong> Write key takeaway, tips, or important summary here...</div>
      </div>
      <p><br></p>
    `;
    executeCommand("insertHTML", calloutHtml);
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
    <div
      className={`overflow-hidden rounded-2xl border transition-colors shadow-2xl flex flex-col ${
        canvasTheme === "dark"
          ? "border-[rgba(237,231,218,0.18)] bg-[#0e1630] text-[#ede7da]"
          : "border-[#e2e8f0] bg-white text-[#1e293b]"
      }`}
    >
      {/* ─── UNIFIED STICKY HEADER & WORD TOOLBAR (Can never overlap!) ─── */}
      <div
        className={`sticky top-0 lg:top-[4rem] z-30 border-b shadow-sm select-none transition-colors ${
          canvasTheme === "dark"
            ? "bg-[#0a1024] border-white/10"
            : "bg-white border-[#e2e8f0]"
        }`}
      >
        {/* ROW 1: Content Header + Scroller View Height + Theme Toggle + Import Word + Pill Tabs */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b select-none transition-colors ${
            canvasTheme === "dark"
              ? "bg-[#090e1f] border-white/10 text-[#ede7da]"
              : "bg-white border-[#f1f5f9] text-[#1e293b]"
          }`}
        >
          <div className="flex items-center gap-3">
            <h2
              className={`text-[0.82rem] font-bold tracking-wider uppercase font-mono ${
                canvasTheme === "dark" ? "text-[#a9b0c2]" : "text-[#64748b]"
              }`}
            >
              CONTENT
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${
                canvasTheme === "dark"
                  ? "bg-[#c9992e]/15 border border-[#c9992e]/30 text-[#e8ce8c]"
                  : "bg-red-50 border border-red-200/60 text-[#c91d24]"
              }`}
            >
              Word-Style Ribbon
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Text Page Height Scroller Toggle */}
            <div className="relative" data-editor-dropdown>
              <button
                type="button"
                title="Change Document Scroller View Height"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setHeightMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xs cursor-pointer transition-colors ${
                  canvasTheme === "dark"
                    ? "border-white/15 bg-white/[0.06] text-[#ede7da] hover:bg-white/[0.12]"
                    : "border-[#cbd5e1] bg-[#f8fafc] text-[#334155] hover:bg-[#f1f5f9]"
                }`}
              >
                <span>↕ Scroller:</span>
                <span
                  className={`font-mono text-[0.7rem] ${
                    canvasTheme === "dark" ? "text-[#e8ce8c]" : "text-[#c91d24]"
                  }`}
                >
                  {editorHeight === "compact" ? "440px" : editorHeight === "expanded" ? "820px" : "600px"}
                </span>
                <span className="text-[0.65rem] opacity-70">▼</span>
              </button>

              {heightMenuOpen && (
                <div
                  className={`absolute right-0 mt-1 z-50 w-48 rounded-xl border p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
                    canvasTheme === "dark"
                      ? "border-white/15 bg-[#0e1630] text-[#ede7da]"
                      : "border-[#cbd5e1] bg-white text-[#334155]"
                  }`}
                >
                  <div className="px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider opacity-60 border-b border-white/10 mb-1">
                    Document Scroller Height
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
                          ? canvasTheme === "dark"
                            ? "bg-[#c9992e]/20 text-[#e8ce8c] font-bold"
                            : "bg-red-50 text-[#c91d24] font-bold"
                          : canvasTheme === "dark"
                          ? "text-[#ede7da] hover:bg-white/[0.08]"
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

            {/* Canvas Theme Toggle (Blog Dark vs Light Paper) */}
            <button
              type="button"
              title="Toggle between Live Blog Dark Background (#070b18) and Light Paper"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleCanvasTheme}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                canvasTheme === "dark"
                  ? "border-[#c9992e]/60 bg-[#070b18] text-[#ede7da] ring-1 ring-[#c9992e]/40 shadow-sm"
                  : "border-[#cbd5e1] bg-[#f8fafc] text-[#334155] hover:border-[#94a3b8]"
              }`}
            >
              <span>{canvasTheme === "dark" ? "🌙" : "☀️"}</span>
              <span className="hidden sm:inline">Theme:</span>
              <span className={canvasTheme === "dark" ? "text-[#c9992e] font-bold" : "text-[#0f172a] font-bold"}>
                {canvasTheme === "dark" ? "Live Blog Dark" : "Light Paper"}
              </span>
              {canvasTheme === "dark" && (
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Blog background active" />
              )}
            </button>

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
              className={`hidden sm:flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                canvasTheme === "dark"
                  ? "border-white/15 bg-white/[0.06] text-[#ede7da] hover:bg-white/[0.12]"
                  : "border-[#cbd5e1] bg-[#f8fafc] text-[#334155] hover:bg-[#f1f5f9]"
              }`}
            >
              <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{importing ? "Importing…" : "Import Word (.docx)"}</span>
            </button>

            {/* Pill Tabs: Visual | HTML | Preview */}
            <div
              className={`flex items-center rounded-full p-1 border ${
                canvasTheme === "dark" ? "bg-[#070b18] border-white/15" : "bg-[#f1f5f9] border-[#e2e8f0]"
              }`}
            >
              <button
                type="button"
                onClick={() => setMode("visual")}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  mode === "visual"
                    ? "bg-[#c91d24] text-white shadow-sm"
                    : canvasTheme === "dark"
                    ? "text-[#a9b0c2] hover:text-[#ede7da]"
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
                    : canvasTheme === "dark"
                    ? "text-[#a9b0c2] hover:text-[#ede7da]"
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
                    : canvasTheme === "dark"
                    ? "text-[#a9b0c2] hover:text-[#ede7da]"
                    : "text-[#64748b] hover:text-[#0f172a]"
                }`}
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* ─── FULL WORD EDITOR RIBBON TOOLBAR (Displayed when mode === 'visual') ─── */}
        {mode === "visual" && (
          <div
            className={`px-4 py-2 space-y-2 border-t select-none transition-colors ${
              canvasTheme === "dark"
                ? "bg-[#0e1630] border-[rgba(237,231,218,0.1)] text-[#ede7da]"
                : "bg-[#f8fafc] border-[#f1f5f9] text-[#334155]"
            }`}
          >
            {/* TOOLBAR ROW 1: History, Heading Styles, Font Family, Font Size, Character Styles, Colors */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
              {/* Group 1: Undo / Redo */}
              <div
                className={`flex items-center border-r pr-2 gap-0.5 ${
                  canvasTheme === "dark" ? "border-white/15" : "border-[#cbd5e1]"
                }`}
              >
                <button
                  type="button"
                  title="Undo (Ctrl+Z)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("undo")}
                  className={`h-7 w-7 rounded flex items-center justify-center font-bold active:scale-95 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#475569] hover:bg-[#e2e8f0]"
                  }`}
                >
                  ↺
                </button>
                <button
                  type="button"
                  title="Redo (Ctrl+Y)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("redo")}
                  className={`h-7 w-7 rounded flex items-center justify-center font-bold active:scale-95 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#475569] hover:bg-[#e2e8f0]"
                  }`}
                >
                  ↻
                </button>
              </div>

              {/* Group 2: Format Dropdown (H1 - H4, Normal, Quote, Code) */}
              <div className="relative" data-editor-dropdown>
                <button
                  type="button"
                  title="Apply heading / style to current line"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setFormatMenuOpen((prev) => !prev)}
                  className={`h-7 rounded border px-2.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs min-w-[130px] justify-between transition-colors ${
                    canvasTheme === "dark"
                      ? "border-white/15 bg-white/[0.06] text-[#ede7da] hover:border-[#c9992e]"
                      : "border-[#cbd5e1] bg-white text-[#334155] hover:border-[#94a3b8]"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span
                      className={`font-bold font-mono text-[0.7rem] px-1 rounded ${
                        canvasTheme === "dark"
                          ? "bg-[#c9992e]/20 text-[#e8ce8c]"
                          : "bg-red-50 text-[#c91d24]"
                      }`}
                    >
                      {currentFormatObj.tag}
                    </span>
                    <span>{currentFormatObj.label}</span>
                  </span>
                  <span className="text-[0.65rem] opacity-70">▼</span>
                </button>

                {formatMenuOpen && (
                  <div
                    className={`absolute left-0 mt-1 z-50 w-52 rounded-xl border p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
                      canvasTheme === "dark"
                        ? "border-white/15 bg-[#0e1630] text-[#ede7da]"
                        : "border-[#cbd5e1] bg-white text-[#334155]"
                    }`}
                  >
                    <div className="px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider opacity-60 border-b border-white/10 mb-1">
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
                            ? canvasTheme === "dark"
                              ? "bg-[#c9992e]/20 text-[#e8ce8c] font-bold"
                              : "bg-red-50 text-[#c91d24] font-bold"
                            : canvasTheme === "dark"
                            ? "text-[#ede7da] hover:bg-white/[0.08]"
                            : "text-[#334155] hover:bg-[#f1f5f9]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center font-mono font-bold text-[0.75rem] opacity-70">
                            {opt.tag}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        <span className="text-[0.65rem] uppercase opacity-60 font-mono">
                          {opt.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Group 3: Quick 1-Click Heading Buttons */}
              <div
                className={`flex items-center gap-0.5 rounded-lg border p-0.5 shadow-xs transition-colors ${
                  canvasTheme === "dark" ? "bg-[#070b18] border-white/15" : "bg-white border-[#cbd5e1]"
                }`}
              >
                <button
                  type="button"
                  title="Heading 1"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBlockFormat("h1")}
                  className={`h-6 px-1.5 rounded text-[0.7rem] font-bold cursor-pointer transition-all ${
                    selectedFormat === "h1"
                      ? "bg-[#c9992e] text-[#070b18] font-black"
                      : canvasTheme === "dark"
                      ? "text-[#a9b0c2] hover:bg-white/[0.1] hover:text-[#ede7da]"
                      : "text-[#475569] hover:bg-[#f1f5f9]"
                  }`}
                >
                  H1
                </button>
                <button
                  type="button"
                  title="Heading 2"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBlockFormat("h2")}
                  className={`h-6 px-1.5 rounded text-[0.7rem] font-bold cursor-pointer transition-all ${
                    selectedFormat === "h2"
                      ? "bg-[#c9992e] text-[#070b18] font-black"
                      : canvasTheme === "dark"
                      ? "text-[#a9b0c2] hover:bg-white/[0.1] hover:text-[#ede7da]"
                      : "text-[#475569] hover:bg-[#f1f5f9]"
                  }`}
                >
                  H2
                </button>
                <button
                  type="button"
                  title="Heading 3"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBlockFormat("h3")}
                  className={`h-6 px-1.5 rounded text-[0.7rem] font-bold cursor-pointer transition-all ${
                    selectedFormat === "h3"
                      ? "bg-[#c9992e] text-[#070b18] font-black"
                      : canvasTheme === "dark"
                      ? "text-[#a9b0c2] hover:bg-white/[0.1] hover:text-[#ede7da]"
                      : "text-[#475569] hover:bg-[#f1f5f9]"
                  }`}
                >
                  H3
                </button>
                <button
                  type="button"
                  title="Normal Paragraph"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBlockFormat("p")}
                  className={`h-6 px-1.5 rounded text-[0.7rem] font-bold cursor-pointer transition-all ${
                    selectedFormat === "p"
                      ? canvasTheme === "dark"
                        ? "bg-white/20 text-[#ede7da]"
                        : "bg-[#334155] text-white"
                      : canvasTheme === "dark"
                      ? "text-[#a9b0c2] hover:bg-white/[0.1] hover:text-[#ede7da]"
                      : "text-[#475569] hover:bg-[#f1f5f9]"
                  }`}
                >
                  ¶ Text
                </button>
              </div>

              <span className={`h-5 w-px ${canvasTheme === "dark" ? "bg-white/15" : "bg-[#cbd5e1]"}`} />

              {/* Group 4: Font Family */}
              <div className="relative" data-editor-dropdown>
                <button
                  type="button"
                  title="Font Family"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setFontMenuOpen((prev) => !prev)}
                  className={`h-7 rounded border px-2 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs min-w-[95px] justify-between transition-colors ${
                    canvasTheme === "dark"
                      ? "border-white/15 bg-white/[0.06] text-[#ede7da] hover:border-[#c9992e]"
                      : "border-[#cbd5e1] bg-white text-[#334155] hover:border-[#94a3b8]"
                  }`}
                >
                  <span className="truncate max-w-[85px]">
                    {FONT_OPTIONS.find((f) => f.value === selectedFont)?.label.replace(" ↕", "") || "Font"}
                  </span>
                  <span className="text-[0.65rem] opacity-70">▼</span>
                </button>

                {fontMenuOpen && (
                  <div
                    className={`absolute left-0 mt-1 z-50 w-52 rounded-xl border p-1.5 shadow-xl max-h-64 overflow-y-auto ${
                      canvasTheme === "dark"
                        ? "border-white/15 bg-[#0e1630] text-[#ede7da]"
                        : "border-[#cbd5e1] bg-white text-[#334155]"
                    }`}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFontFamily(f.value)}
                        style={{ fontFamily: f.value === "Default" ? "inherit" : f.value }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                          selectedFont === f.value
                            ? canvasTheme === "dark"
                              ? "bg-[#c9992e]/20 text-[#e8ce8c] font-bold"
                              : "bg-red-50 text-[#c91d24] font-bold"
                            : canvasTheme === "dark"
                            ? "text-[#ede7da] hover:bg-white/[0.08]"
                            : "text-[#334155] hover:bg-[#f1f5f9]"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Group 5: Font Size Stepper */}
              <div
                className={`flex items-center rounded border h-7 px-1 shadow-xs transition-colors ${
                  canvasTheme === "dark" ? "border-white/15 bg-white/[0.06]" : "border-[#cbd5e1] bg-white"
                }`}
              >
                <button
                  type="button"
                  title="Decrease font size"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleFontSizeChange(-1)}
                  className={`px-1 text-xs font-bold cursor-pointer ${
                    canvasTheme === "dark" ? "text-[#a9b0c2] hover:text-white" : "text-[#64748b] hover:text-[#0f172a]"
                  }`}
                >
                  −
                </button>
                <span
                  className={`px-1 text-xs font-semibold min-w-[20px] text-center ${
                    canvasTheme === "dark" ? "text-[#ede7da]" : "text-[#0f172a]"
                  }`}
                >
                  {fontSize}
                </span>
                <button
                  type="button"
                  title="Increase font size"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleFontSizeChange(1)}
                  className={`px-1 text-xs font-bold cursor-pointer ${
                    canvasTheme === "dark" ? "text-[#a9b0c2] hover:text-white" : "text-[#64748b] hover:text-[#0f172a]"
                  }`}
                >
                  +
                </button>
              </div>

              <span className={`h-5 w-px ${canvasTheme === "dark" ? "bg-white/15" : "bg-[#cbd5e1]"}`} />

              {/* Group 6: Character Styles (Bold, Italic, Underline, Strikethrough, Superscript, Subscript) */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  title="Bold (Ctrl+B)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("bold")}
                  className={`h-7 w-7 rounded flex items-center justify-center font-bold active:scale-95 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  title="Italic (Ctrl+I)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("italic")}
                  className={`h-7 w-7 rounded flex items-center justify-center italic active:scale-95 cursor-pointer font-serif transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  I
                </button>
                <button
                  type="button"
                  title="Underline (Ctrl+U)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("underline")}
                  className={`h-7 w-7 rounded flex items-center justify-center underline active:scale-95 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  U
                </button>
                <button
                  type="button"
                  title="Strikethrough"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("strikeThrough")}
                  className={`h-7 w-7 rounded flex items-center justify-center line-through font-semibold active:scale-95 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  S
                </button>
                <button
                  type="button"
                  title="Superscript (X²)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("superscript")}
                  className={`h-7 w-7 rounded flex items-center justify-center text-[0.7rem] font-bold active:scale-95 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  X²
                </button>
                <button
                  type="button"
                  title="Subscript (X₂)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("subscript")}
                  className={`h-7 w-7 rounded flex items-center justify-center text-[0.7rem] font-bold active:scale-95 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  X₂
                </button>
              </div>

              <span className={`h-5 w-px ${canvasTheme === "dark" ? "bg-white/15" : "bg-[#cbd5e1]"}`} />

              {/* Group 7: Text Color with Palette */}
              <div className="relative" data-editor-dropdown>
                <button
                  type="button"
                  title="Text Color"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setColorMenuOpen((prev) => !prev)}
                  className={`h-7 px-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  <span className="font-bold underline decoration-[#c9992e] decoration-2">A</span>
                  <span className="text-[0.6rem] opacity-70">▼</span>
                </button>

                {colorMenuOpen && (
                  <div
                    className={`absolute left-0 mt-1 z-50 w-52 rounded-xl border p-2.5 shadow-xl ${
                      canvasTheme === "dark"
                        ? "border-white/15 bg-[#0e1630] text-[#ede7da]"
                        : "border-[#cbd5e1] bg-white text-[#334155]"
                    }`}
                  >
                    <div className="text-[0.65rem] font-bold uppercase tracking-wider opacity-60 mb-1.5 px-1">
                      Text Color Palette
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          title={c.name}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyColor(c.value)}
                          className="h-6 w-6 rounded-md border border-white/20 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                    <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                      <span className="text-[0.7rem] opacity-80">Custom Picker:</span>
                      <input
                        type="color"
                        onChange={(e) => applyColor(e.target.value)}
                        className="h-6 w-6 cursor-pointer border-0 p-0 rounded bg-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Group 8: Highlight Background Color with Palette */}
              <div className="relative" data-editor-dropdown>
                <button
                  type="button"
                  title="Text Highlight Color"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setHighlightMenuOpen((prev) => !prev)}
                  className={`h-7 px-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  <span className="font-bold bg-[#c9992e]/40 px-1 rounded text-[0.8rem] text-white">A</span>
                  <span className="text-[0.6rem] opacity-70">▼</span>
                </button>

                {highlightMenuOpen && (
                  <div
                    className={`absolute left-0 mt-1 z-50 w-48 rounded-xl border p-2 shadow-xl ${
                      canvasTheme === "dark"
                        ? "border-white/15 bg-[#0e1630] text-[#ede7da]"
                        : "border-[#cbd5e1] bg-white text-[#334155]"
                    }`}
                  >
                    <div className="text-[0.65rem] font-bold uppercase tracking-wider opacity-60 mb-1.5 px-1">
                      Highlight Marker
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-1">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          title={c.name}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyHighlight(c.value)}
                          className="h-6 rounded-md border border-white/20 cursor-pointer hover:scale-105 transition-transform text-[0.65rem] font-semibold text-white px-1 truncate"
                          style={{
                            backgroundColor: c.value === "transparent" ? "rgba(255,255,255,0.08)" : c.value,
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TOOLBAR ROW 2: Alignment, Lists, Indents, Insert Elements (Tables, Callout, Media, Divider), Clear */}
            <div
              className={`flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t text-xs ${
                canvasTheme === "dark" ? "border-white/10" : "border-[#e2e8f0]/80"
              }`}
            >
              {/* Group 9: Alignment (Left, Center, Right, Justify) */}
              <div
                className={`flex items-center gap-0.5 border-r pr-2 ${
                  canvasTheme === "dark" ? "border-white/15" : "border-[#cbd5e1]"
                }`}
              >
                <button
                  type="button"
                  title="Align Left"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("justifyLeft")}
                  className={`h-7 w-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  ⇤
                </button>
                <button
                  type="button"
                  title="Align Center"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("justifyCenter")}
                  className={`h-7 w-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  ≡
                </button>
                <button
                  type="button"
                  title="Align Right"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("justifyRight")}
                  className={`h-7 w-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  ⇥
                </button>
                <button
                  type="button"
                  title="Justify Text"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("justifyFull")}
                  className={`h-7 w-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  ☰
                </button>
              </div>

              {/* Group 10: Lists (Bullet, Numbered) */}
              <div
                className={`flex items-center gap-0.5 border-r pr-2 ${
                  canvasTheme === "dark" ? "border-white/15" : "border-[#cbd5e1]"
                }`}
              >
                <button
                  type="button"
                  title="Bullet List"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("insertUnorderedList")}
                  className={`h-7 px-2 rounded flex items-center justify-center cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  •≡ List
                </button>
                <button
                  type="button"
                  title="Numbered List"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("insertOrderedList")}
                  className={`h-7 px-2 rounded flex items-center justify-center cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  1≡ List
                </button>
              </div>

              {/* Group 11: Indent / Outdent */}
              <div
                className={`flex items-center gap-0.5 border-r pr-2 ${
                  canvasTheme === "dark" ? "border-white/15" : "border-[#cbd5e1]"
                }`}
              >
                <button
                  type="button"
                  title="Decrease Indent"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("outdent")}
                  className={`h-7 w-7 rounded flex items-center justify-center font-bold cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  ⇤
                </button>
                <button
                  type="button"
                  title="Increase Indent"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("indent")}
                  className={`h-7 w-7 rounded flex items-center justify-center font-bold cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  ⇥
                </button>
              </div>

              {/* Group 12: Insert Word Elements (Link, Image, Table, Callout Box, Divider, Quote) */}
              <div
                className={`flex items-center gap-1 border-r pr-2 ${
                  canvasTheme === "dark" ? "border-white/15" : "border-[#cbd5e1]"
                }`}
              >
                <button
                  type="button"
                  title="Insert Hyperlink"
                  onMouseDown={saveSelection}
                  onClick={handleInsertLink}
                  className={`h-7 px-2 rounded flex items-center gap-1 active:scale-95 cursor-pointer text-xs transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  <span>🔗</span>
                  <span className="hidden sm:inline">Link</span>
                </button>
                <button
                  type="button"
                  title="Insert Image"
                  onMouseDown={saveSelection}
                  onClick={handleInsertImage}
                  className={`h-7 px-2 rounded flex items-center gap-1 active:scale-95 cursor-pointer text-xs transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  <span>🖼</span>
                  <span className="hidden sm:inline">Image</span>
                </button>

                {/* Table Insert Menu */}
                <div className="relative" data-editor-dropdown>
                  <button
                    type="button"
                    title="Insert Table (Word Style)"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setTableMenuOpen((prev) => !prev)}
                    className={`h-7 px-2 rounded flex items-center gap-1 active:scale-95 cursor-pointer text-xs transition-colors ${
                      canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    <span>⊞</span>
                    <span className="hidden sm:inline">Table</span>
                    <span className="text-[0.6rem] opacity-70">▼</span>
                  </button>

                  {tableMenuOpen && (
                    <div
                      className={`absolute left-0 mt-1 z-50 w-44 rounded-xl border p-1.5 shadow-xl ${
                        canvasTheme === "dark"
                          ? "border-white/15 bg-[#0e1630] text-[#ede7da]"
                          : "border-[#cbd5e1] bg-white text-[#334155]"
                      }`}
                    >
                      <div className="px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider opacity-60 border-b border-white/10 mb-1">
                        Insert Table Grid
                      </div>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsertTable(2, 2)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 cursor-pointer ${
                          canvasTheme === "dark" ? "hover:bg-white/[0.08]" : "hover:bg-[#f1f5f9]"
                        }`}
                      >
                        <span>⊞</span> 2 × 2 Table
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsertTable(3, 3)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 cursor-pointer ${
                          canvasTheme === "dark" ? "hover:bg-white/[0.08]" : "hover:bg-[#f1f5f9]"
                        }`}
                      >
                        <span>⊞</span> 3 × 3 Table (Standard)
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsertTable(4, 4)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 cursor-pointer ${
                          canvasTheme === "dark" ? "hover:bg-white/[0.08]" : "hover:bg-[#f1f5f9]"
                        }`}
                      >
                        <span>⊞</span> 4 × 4 Table
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  title="Insert Note / Callout Box"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleInsertCallout}
                  className={`h-7 px-2 rounded flex items-center gap-1 active:scale-95 cursor-pointer text-xs transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  <span>💡</span>
                  <span className="hidden md:inline">Callout</span>
                </button>

                <button
                  type="button"
                  title="Insert Horizontal Divider Line"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeCommand("insertHorizontalRule")}
                  className={`h-7 px-1.5 rounded flex items-center justify-center font-bold text-xs active:scale-95 cursor-pointer transition-colors ${
                    canvasTheme === "dark" ? "text-[#ede7da] hover:bg-white/[0.1]" : "text-[#334155] hover:bg-[#e2e8f0]"
                  }`}
                >
                  ― Line
                </button>
              </div>

              {/* Group 13: Clear Formatting */}
              <button
                type="button"
                title="Clear All Formatting (Tx)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand("removeFormat")}
                className={`h-7 px-2 rounded flex items-center gap-1 font-semibold cursor-pointer ml-auto transition-colors ${
                  canvasTheme === "dark"
                    ? "text-[#a9b0c2] hover:text-white hover:bg-white/[0.1]"
                    : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0]"
                }`}
              >
                <span>Tx</span>
                <span className="text-[0.65rem] uppercase">Clear</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── DEDICATED DOCUMENT TEXT SCROLLER VIEWPORT ─── */}
      {/* ─── Mode 1: Visual Mode (contentEditable with Live Blog Dark Background (#070b18) or Light Paper) ─── */}
      {mode === "visual" && (
        <div
          className={`editor-scroller-viewport relative transition-all ${
            canvasTheme === "dark"
              ? "theme-blog-dark bg-[#030712] p-3 sm:p-6"
              : "bg-[#f1f5f9]/70 p-3 sm:p-6"
          } ${isScrolled ? "is-scrolled" : ""} ${hasMoreScroll ? "has-more-scroll" : ""}`}
        >
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className={`editor-text-scroller mx-auto max-w-4xl rounded-2xl transition-all ${
              canvasTheme === "dark"
                ? "theme-blog-dark bg-[#070b18] border border-[rgba(237,231,218,0.18)] p-6 sm:p-14 shadow-2xl text-[#D7D9E0]"
                : "bg-white shadow-sm border border-[#e2e8f0] p-6 sm:p-12 text-[#1e293b]"
            }`}
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
              className={`prose max-w-none min-h-[340px] leading-[1.8] focus:outline-none text-[1.05rem] ${
                canvasTheme === "dark"
                  ? "prose-invert text-[#D7D9E0] font-sans [&_h1]:font-display [&_h1]:text-[2.2rem] [&_h1]:font-light [&_h1]:text-[#ede7da] [&_h1]:tracking-tight [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:border-b [&_h1]:border-white/10 [&_h1]:pb-2 [&_h2]:font-display [&_h2]:text-[1.8rem] [&_h2]:font-light [&_h2]:text-[#ede7da] [&_h2]:tracking-tight [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:font-display [&_h3]:text-[1.4rem] [&_h3]:font-light [&_h3]:text-[#ede7da] [&_h3]:mt-5 [&_h3]:mb-2 [&_h4]:font-display [&_h4]:text-[1.15rem] [&_h4]:font-medium [&_h4]:text-[#c9992e] [&_h4]:mt-4 [&_h4]:mb-1.5 [&_p]:my-3.5 [&_p]:leading-[1.8] [&_p]:text-[#D7D9E0] [&_blockquote]:border-l-2 [&_blockquote]:border-[#c9992e] [&_blockquote]:bg-[#c9992e]/10 [&_blockquote]:pl-5 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:text-[#E0C9A6] [&_blockquote]:my-6 [&_blockquote]:rounded-r-lg [&_pre]:bg-[#030712] [&_pre]:border [&_pre]:border-white/10 [&_pre]:text-[#38bdf8] [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-4 [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1 [&_a]:text-[#e8ce8c] [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:border [&_table]:border-white/20 [&_th]:border [&_th]:border-white/20 [&_th]:bg-white/10 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-white [&_td]:border [&_td]:border-white/10 [&_td]:p-2.5 [&_hr]:my-6 [&_hr]:border-[rgba(237,231,218,0.15)]"
                  : "text-[#1e293b] font-sans [&_h1]:text-[2.2rem] [&_h1]:font-bold [&_h1]:text-[#0f172a] [&_h1]:tracking-tight [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:border-b [&_h1]:border-slate-100 [&_h1]:pb-2 [&_h2]:text-[1.75rem] [&_h2]:font-bold [&_h2]:text-[#0f172a] [&_h2]:tracking-tight [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h3]:text-[1.35rem] [&_h3]:font-bold [&_h3]:text-[#1e293b] [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-[1.12rem] [&_h4]:font-semibold [&_h4]:text-[#334155] [&_h4]:mt-3 [&_h4]:mb-1.5 [&_p]:my-2.5 [&_p]:leading-[1.8] [&_blockquote]:border-l-4 [&_blockquote]:border-[#c91d24] [&_blockquote]:bg-red-50/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:text-[#475569] [&_blockquote]:my-4 [&_blockquote]:rounded-r-lg [&_pre]:bg-[#0f172a] [&_pre]:text-[#38bdf8] [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-4 [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:border [&_table]:border-slate-300 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_hr]:my-6 [&_hr]:border-slate-200"
              }`}
            />
            {(!content || content === "<p><br></p>" || content === "<br>") && (
              <div
                onClick={() => visualEditorRef.current?.focus()}
                className={`pointer-events-none absolute left-12 top-12 italic text-[1.05rem] ${
                  canvasTheme === "dark" ? "text-[#8a93a8]" : "text-[#94a3b8]"
                }`}
              >
                Write your blog content here... Live blog dark theme matches your frontend layout.
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
            className="editor-text-scroller w-full rounded-xl border border-[#334155] bg-[#030712] p-4 font-mono text-[0.875rem] text-[#38bdf8] focus:border-[#c9992e] focus:outline-none"
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
              className="prose prose-invert max-w-none text-[#d7d9e0] text-[1.05rem] leading-[1.8] [&_h1]:text-[#ede7da] [&_h1]:font-display [&_h2]:text-[#ede7da] [&_h2]:font-display [&_h3]:text-[#ede7da] [&_h3]:font-display [&_a]:text-[#e8ce8c] [&_blockquote]:border-l-2 [&_blockquote]:border-[#c9992e] [&_blockquote]:pl-4 [&_blockquote]:italic"
              dangerouslySetInnerHTML={{ __html: content || "<p className='text-dim italic'>No content written yet.</p>" }}
            />
          </div>
        </div>
      )}

      {/* ─── DOCKED BOTTOM STATUS BAR ─── */}
      <div
        className={`flex flex-wrap items-center justify-between border-t px-6 py-2.5 text-xs select-none transition-colors ${
          canvasTheme === "dark"
            ? "bg-[#090e1f] border-white/10 text-[#8a93a8]"
            : "bg-[#f8fafc] border-[#e2e8f0] text-[#64748b]"
        }`}
      >
        <div className="flex items-center gap-4">
          <span>Words: {content.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length}</span>
          <span>Characters: {content.replace(/<[^>]*>/g, "").length}</span>
          <span className="hidden md:inline opacity-40">|</span>
          <span className="hidden md:inline opacity-80">
            Scroller Height:{" "}
            <strong className={canvasTheme === "dark" ? "text-[#ede7da] font-mono" : "text-[#334155] font-mono"}>
              {currentHeightPx}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[0.7rem] ${
              canvasTheme === "dark"
                ? "bg-[#070b18] border border-white/15 text-[#ede7da]"
                : "bg-white border-[#cbd5e1] text-[#334155]"
            }`}
          >
            <span className="opacity-60">Active Line:</span>
            <span className={canvasTheme === "dark" ? "font-bold text-[#e8ce8c]" : "font-bold text-[#c91d24]"}>
              {currentFormatObj.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className={canvasTheme === "dark" ? "text-[#ede7da]" : "text-[#64748b]"}>
              Word editor synchronized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
