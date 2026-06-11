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
