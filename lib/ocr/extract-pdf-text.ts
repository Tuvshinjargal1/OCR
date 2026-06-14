import { pdf } from "pdf-to-img";
import { createWorker } from "tesseract.js";

export type PageText = {
  page: number;
  text: string;
};

export type OcrResult = {
  pages: PageText[];
  fullText: string;
  pageCount: number;
};

export type FileOcrResult = OcrResult & {
  fileName: string;
};

export type MultiOcrResult = {
  files: FileOcrResult[];
  combinedFullText: string;
  totalPageCount: number;
};

export type ExtractPdfTextOptions = {
  language?: string;
  scale?: number;
};

const DEFAULT_LANGUAGE = "mon+eng";
const DEFAULT_SCALE = 2;

export async function extractTextFromPdf(
  pdfBuffer: Buffer,
  options: ExtractPdfTextOptions = {},
): Promise<OcrResult> {
  const language = options.language ?? DEFAULT_LANGUAGE;
  const scale = options.scale ?? DEFAULT_SCALE;

  const worker = await createWorker(language);

  try {
    const doc = await pdf(pdfBuffer, { scale });
    const pages: PageText[] = [];

    let pageNum = 0;
    for await (const imageBuffer of doc) {
      pageNum += 1;
      const {
        data: { text },
      } = await worker.recognize(imageBuffer);
      pages.push({ page: pageNum, text: text.trim() });
    }

    await doc.destroy();

    const fullText = pages.map((entry) => entry.text).join("\n\n");

    return {
      pages,
      fullText,
      pageCount: pages.length,
    };
  } finally {
    await worker.terminate();
  }
}

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export async function extractTextFromPdfs(
  pdfFiles: File[],
  options: ExtractPdfTextOptions = {},
): Promise<MultiOcrResult> {
  const files: FileOcrResult[] = [];

  for (const file of pdfFiles) {
    if (!isPdfFile(file)) {
      throw new Error(`"${file.name}" нь PDF файл биш байна.`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractTextFromPdf(buffer, options);
    files.push({ fileName: file.name, ...result });
  }

  const combinedFullText = files
    .map((entry) => `=== ${entry.fileName} ===\n\n${entry.fullText}`)
    .join("\n\n");

  return {
    files,
    combinedFullText,
    totalPageCount: files.reduce((sum, entry) => sum + entry.pageCount, 0),
  };
}
