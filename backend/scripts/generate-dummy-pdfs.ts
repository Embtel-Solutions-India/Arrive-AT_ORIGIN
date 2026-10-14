import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendUploadsDir = path.resolve(__dirname, "../uploads/ebooks");
const frontendPublicDir = path.resolve(__dirname, "../../frontend/public/ebooks");

[backendUploadsDir, frontendPublicDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface BookPdfMeta {
  filename: string;
  title: string;
  subtitle: string;
  category: string;
  summary: string;
  chapters: string[];
}

const booksToGenerate: BookPdfMeta[] = [
  {
    filename: "arrive-at-origin-part-one.pdf",
    title: "AAO - Arrive at Origin (Part 1)",
    subtitle: "The Definitive Framework of Self-Realisation & Living from Origin",
    category: "Metaphysics & Concept Clearing",
    summary:
      "Origin is not a distant destination or an attained state; it is the position that remains when you stop moving away from yourself. Through the practice of Concept Clearing and direct differentiation, this foundational volume maps the four primary movements of returning to the origin of consciousness.",
    chapters: [
      "Movement I: The Illusion of Distance and the Veiling Mind",
      "Movement II: Concept Clearing as the Gateway to Stillness",
      "Movement III: Differentiation - Separating Thought from Knower",
      "Movement IV: The Position That Remains - Living from Origin",
    ],
  },
  {
    filename: "your-path-to-transformation.pdf",
    title: "Your Path to Transformation",
    subtitle: "Meeting Change, Uncertainty, and Renewal with Clarity",
    category: "Transformation & Conscious Living",
    summary:
      "Life does not consult us before it alters our reality. In this profound guide, Dr. Alka Chopra Madan presents an uncompromising yet compassionate inquiry into transformation. True metamorphosis is never an addition of new identities, but the deliberate stripping away of false conclusions.",
    chapters: [
      "Chapter 1: When the Ground Shifts - Navigating the Uninvited",
      "Chapter 2: The Anatomy of Resistance and the Fear of Void",
      "Chapter 3: Alchemical Surrender - Allowing What Is",
      "Chapter 4: The Emergence of the Meta-Human in Everyday Life",
    ],
  },
  {
    filename: "your-path-to-peace.pdf",
    title: "Your Path to Peace",
    subtitle: "A Journey Beyond Calmness Toward Unshakeable Inner Quiet",
    category: "Peace & Meditation",
    summary:
      "Peace is often mistaken for quiet surroundings or temporary emotional calm. This book explores peace as an irreducible truth of your being - an enduring presence that cannot be touched by crisis, conflict, or grief when you anchor yourself in the Origin.",
    chapters: [
      "Chapter 1: The Counterfeit Calm vs. Genuine Peace",
      "Chapter 2: Clearing the Unfinished Business of the Heart",
      "Chapter 3: The Sanctuary Within - Silent Recognition",
      "Chapter 4: Walking in Tranquility Through a Turbulent World",
    ],
  },
  {
    filename: "your-path-to-spirituality.pdf",
    title: "Your Path to Spirituality",
    subtitle: "Reclaiming the Essence of Spirit Beyond Dogma and Labels",
    category: "Spirituality & Philosophy",
    summary:
      "Stripping away ritualistic dogma and institutional dogma, this book re-examines spirituality as a direct, empirical inquiry into consciousness. Experience the unconditioned self through direct observation and living clarity.",
    chapters: [
      "Chapter 1: Beyond the Label - The Pure Inquiry",
      "Chapter 2: Mind, Ego, and the Spiritual Trap of Seeking",
      "Chapter 3: Direct Perception - Seeing Without the Lens of Past",
      "Chapter 4: The Living Spirit in Daily Relationships",
    ],
  },
  {
    filename: "arrive-at-origin-part-two.pdf",
    title: "AAO - Arrive at Origin (Part 2)",
    subtitle: "Advanced Inquiries, Everyday Obligation, and Meta-Human Realisation",
    category: "AAO Series & Advanced Teachings",
    summary:
      "Part Two deepens the exploration into Concept Clearing under the pressure of ordinary obligations, complex relationships, and professional demands. A masterclass in anchoring transcendent understanding into concrete daily action.",
    chapters: [
      "Chapter 1: The Fire of Daily Obligation as Fuel for Awakening",
      "Chapter 2: Advanced Concept Clearing Protocols",
      "Chapter 3: Embodying the Meta-Human in Modern Society",
      "Chapter 4: Origin Consciousness as Infinite Resource",
    ],
  },
  {
    filename: "your-path-to-healing.pdf",
    title: "Your Path to Healing",
    subtitle: "Holding Space Across Living, Loss, and True Restoration",
    category: "Healing & Grief Counsel",
    summary:
      "Healing is not fixing what was broken, for the Origin cannot be broken. It is the restoration of awareness to that which was never damaged. A sacred manual for moving through bereavement, emotional upheaval, and physical transitions.",
    chapters: [
      "Chapter 1: The Nature of Loss and the Sacredness of Grief",
      "Chapter 2: Releasing the Burden of Formulaic Recovery",
      "Chapter 3: Cellular Memory and the Re-alignment of Vitality",
      "Chapter 4: Whole Again - The Radiant Self Unveiled",
    ],
  },
  {
    filename: "keeping-it-simple.pdf",
    title: "Keeping It Simple",
    subtitle: "Daily Reflections on Uncluttering the Mind and Recovering Quiet",
    category: "Mindfulness & Simplicity",
    summary:
      "Soul, body, and mind do not require life to be made more complicated than it already is. A series of concise, potent reflections designed to clear mental clutter, release unnecessary burdens, and restore immediate lightness.",
    chapters: [
      "Reflection 1: The Art of Putting Down What Is Not Yours",
      "Reflection 2: Quiet Mornings - Meeting the Day Uncluttered",
      "Reflection 3: Speaking Less, Seeing More",
      "Reflection 4: The Elegance of Simple Being",
    ],
  },
];

function escapePdfText(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createPdfContent(meta: BookPdfMeta): Buffer {
  const lines: string[] = [];

  // Helper to build a basic page stream
  const contentStream = `
BT
/F2 10 Tf
50 740 Td
(ARRIVE AT ORIGIN - OFFICIAL E-BOOK SOFT COPY EDITION) Tj
0 -24 Td
/F1 20 Tf
(${escapePdfText(meta.title)}) Tj
0 -18 Td
/F2 11 Tf
(${escapePdfText(meta.subtitle)}) Tj
0 -14 Td
(By Dr. Alka Chopra Madan | Soul Body Publishing) Tj
0 -26 Td
/F1 12 Tf
(CATEGORY: ${escapePdfText(meta.category)}) Tj
0 -20 Td
/F2 10 Tf
(SYNOPSIS & CORE TEACHING:) Tj
0 -16 Td
(${escapePdfText(meta.summary.slice(0, 100))}) Tj
0 -14 Td
(${escapePdfText(meta.summary.slice(100, 200))}) Tj
0 -14 Td
(${escapePdfText(meta.summary.slice(200, 300))}) Tj
0 -14 Td
(${escapePdfText(meta.summary.slice(300, 400))}) Tj
0 -24 Td
/F1 12 Tf
(TABLE OF CONTENTS:) Tj
0 -16 Td
/F2 10 Tf
${meta.chapters.map((ch) => `(${escapePdfText(ch)}) Tj\n0 -14 Td`).join("\n")}
0 -20 Td
/F1 12 Tf
(SAMPLE EXCERPT & INQUIRY PROTOCOL:) Tj
0 -16 Td
/F2 10 Tf
(Begin with the stillness that precedes thought. Look not for a new mental) Tj
0 -14 Td
(construct, but notice that which observes the arising and fading of thoughts.) Tj
0 -14 Td
(In that observant quiet, you are already at Origin.) Tj
0 -30 Td
/F2 8 Tf
(Copyright 2026 Dr. Alka Chopra Madan. All Rights Reserved.) Tj
0 -10 Td
(Soul Body Healing Center & Arrive at Origin Publishing. Unauthorized distribution prohibited.) Tj
ET
`.trim();

  const streamLength = Buffer.byteLength(contentStream, "utf-8");

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 + ${streamLength} 00000 n 
0000000380 + ${streamLength} 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
${450 + streamLength}
%%EOF`;

  return Buffer.from(pdf, "utf-8");
}

console.log("📚 Generating dummy book PDFs for Arrive at Origin...");

for (const book of booksToGenerate) {
  const pdfBuffer = createPdfContent(book);

  const backendPath = path.join(backendUploadsDir, book.filename);
  const frontendPath = path.join(frontendPublicDir, book.filename);

  fs.writeFileSync(backendPath, pdfBuffer);
  fs.writeFileSync(frontendPath, pdfBuffer);

  console.log(`✅ Generated: ${book.filename} (${pdfBuffer.length} bytes)`);
}

console.log("🎉 All 7 dummy book PDFs successfully created in backend and frontend!");
