import {
  extractTextFromPdf,
  extractTextFromPdfs,
} from "@/lib/ocr/extract-pdf-text";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function getPdfFiles(formData: FormData): File[] {
  const multiFiles = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (multiFiles.length > 0) {
    return multiFiles;
  }

  const singleFile = formData.get("file");
  if (singleFile instanceof File && singleFile.size > 0) {
    return [singleFile];
  }

  return [];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfFiles = getPdfFiles(formData);
    const language = formData.get("language");
    const scale = formData.get("scale");

    if (pdfFiles.length === 0) {
      return NextResponse.json(
        { error: "PDF файл оруулна уу." },
        { status: 400 },
      );
    }

    for (const file of pdfFiles) {
      if (!isPdfFile(file)) {
        return NextResponse.json(
          { error: `"${file.name}" нь PDF файл биш байна.` },
          { status: 400 },
        );
      }
    }

    const options = {
      language:
        typeof language === "string" && language.length > 0
          ? language
          : undefined,
      scale:
        typeof scale === "string" && scale.length > 0
          ? Number.parseInt(scale, 10)
          : undefined,
    };

    if (pdfFiles.length === 1) {
      const buffer = Buffer.from(await pdfFiles[0].arrayBuffer());
      const result = await extractTextFromPdf(buffer, options);
      return NextResponse.json(result);
    }

    const result = await extractTextFromPdfs(pdfFiles, options);
    return NextResponse.json(result);
  } catch (error) {
    console.error("OCR алдаа:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Текст ялгах явцад алдаа гарлаа.",
      },
      { status: 500 },
    );
  }
}
