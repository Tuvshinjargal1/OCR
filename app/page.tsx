"use client";

import { useState } from "react";

type PageText = {
  page: number;
  text: string;
};

type OcrResult = {
  pages: PageText[];
  fullText: string;
  pageCount: number;
};

const LANGUAGE_OPTIONS = [
  { value: "mon+eng", label: "Монгол + Англи" },
  { value: "mon", label: "Монгол" },
  { value: "eng", label: "Англи" },
] as const;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>(LANGUAGE_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("PDF файл сонгоно уу.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Текст ялгахад алдаа гарлаа.");
      }

      setResult(data as OcrResult);
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

  function handleCopy() {
    if (!result?.fullText) return;
    void navigator.clipboard.writeText(result.fullText);
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Баримт бичиг таних
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
            Скан хийсэн PDF файлаас Tesseract OCR ашиглан текст ялгаж авна.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="space-y-2">
            <label
              htmlFor="pdf-file"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              PDF файл
            </label>
            <input
              id="pdf-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setError(null);
              }}
              className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-zinc-300"
            />
            {file ? (
              <p className="text-sm text-zinc-500">
                Сонгосон: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
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
            disabled={loading || !file}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Текст ялгаж байна..." : "Текст ялгах"}
          </button>
        </form>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {result ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Үр дүн ({result.pageCount} хуудас)
              </h2>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Бүх текст хуулах
              </button>
            </div>

            <div className="space-y-4">
              {result.pages.map((page) => (
                <article
                  key={page.page}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h3 className="mb-3 text-sm font-medium text-zinc-500">
                    Хуудас {page.page}
                  </h3>
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-6 text-zinc-800 dark:text-zinc-200">
                    {page.text || "(текст олдсонгүй)"}
                  </pre>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
