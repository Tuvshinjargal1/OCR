"use client";

import { useRef, useState } from "react";

type PageText = {
  page: number;
  text: string;
};

type OcrResult = {
  pages: PageText[];
  fullText: string;
  pageCount: number;
};

type FileOcrResult = OcrResult & {
  fileName: string;
};

type MultiOcrResult = {
  files: FileOcrResult[];
  combinedFullText: string;
  totalPageCount: number;
};

type DisplayResult =
  | { mode: "single"; data: OcrResult }
  | { mode: "multi"; data: MultiOcrResult };

const LANGUAGE_OPTIONS = [
  { value: "mon+eng", label: "Монгол + Англи" },
  { value: "mon", label: "Монгол" },
  { value: "eng", label: "Англи" },
] as const;

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState<string>(LANGUAGE_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DisplayResult | null>(null);

  function getSelectedFiles(): File[] {
    if (files.length > 0) {
      return files;
    }
    return Array.from(fileInputRef.current?.files ?? []);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);
    setError(null);
    setResult(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedFiles = getSelectedFiles();
    if (selectedFiles.length === 0) {
      setError("PDF файл сонгоно уу.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append("files", file);
      }
      formData.append("language", language);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Текст ялгахад алдаа гарлаа.");
      }

      if ("files" in data && Array.isArray(data.files)) {
        setResult({ mode: "multi", data: data as MultiOcrResult });
      } else {
        setResult({ mode: "single", data: data as OcrResult });
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Текст ялгахад алдаа гарлаа.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    if (!text) return;
    void navigator.clipboard.writeText(text);
  }

  function renderPages(pages: PageText[], keyPrefix: string) {
    return pages.map((page) => (
      <article
        key={`${keyPrefix}-${page.page}`}
        className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h3 className="mb-3 text-sm font-medium text-zinc-500">
          Хуудас {page.page}
        </h3>
        <pre className="whitespace-pre-wrap font-mono text-sm leading-6 text-zinc-800 dark:text-zinc-200">
          {page.text || "(текст олдсонгүй)"}
        </pre>
      </article>
    ));
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Баримт бичиг таних
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
            Скан хийсэн PDF файлуудаас Tesseract OCR ашиглан текст ялгаж авна.
            Нэг эсвэл олон PDF файл сонгож болно.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="space-y-2">
            <label
              htmlFor="pdf-files"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              PDF файл(ууд)
            </label>
            <input
              ref={fileInputRef}
              id="pdf-files"
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-zinc-300"
            />
            {files.length > 0 ? (
              <ul className="space-y-1 text-sm text-zinc-500">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`}>
                    {file.name} ({formatFileSize(file.size)})
                  </li>
                ))}
                <li className="pt-1 font-medium text-zinc-600 dark:text-zinc-400">
                  Нийт: {files.length} файл
                </li>
              </ul>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="language"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              OCR хэл
            </label>
            <select
              id="language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading
              ? files.length > 1
                ? `${files.length} файл ялгаж байна...`
                : "Текст ялгаж байна..."
              : files.length > 1
                ? `${files.length} файл ялгах`
                : "Текст ялгах"}
          </button>
        </form>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {result?.mode === "single" ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Үр дүн ({result.data.pageCount} хуудас)
              </h2>
              <button
                type="button"
                onClick={() => handleCopy(result.data.fullText)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Бүх текст хуулах
              </button>
            </div>
            <div className="space-y-4">
              {renderPages(result.data.pages, "single")}
            </div>
          </section>
        ) : null}

        {result?.mode === "multi" ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Үр дүн ({result.data.files.length} файл,{" "}
                {result.data.totalPageCount} хуудас)
              </h2>
              <button
                type="button"
                onClick={() => handleCopy(result.data.combinedFullText)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Бүх текст хуулах
              </button>
            </div>

            {result.data.files.map((fileResult) => (
              <div key={fileResult.fileName} className="space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                    {fileResult.fileName}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500">
                      {fileResult.pageCount} хуудас
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(fileResult.fullText)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Хуулах
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {renderPages(fileResult.pages, fileResult.fileName)}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}
