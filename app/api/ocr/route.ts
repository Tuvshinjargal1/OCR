import { extractTextFromPdf } from "@/lib/ocr/extract-pdf-text";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const language = formData.get("language");
    const scale = formData.get("scale");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "PDF файл оруулна уу." },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Зөвхөн PDF файл дэмжигдэнэ." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractTextFromPdf(buffer, {
      language: typeof language === "string" && language.length > 0 ? language : undefined,
      scale:
        typeof scale === "string" && scale.length > 0
          ? Number.parseInt(scale, 10)
          : undefined,
    });

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
