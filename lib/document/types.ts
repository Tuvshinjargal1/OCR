export type DocumentArticle = {
  article_id: string;
  chapter: string;
  article: string;
  text: string;
  keywords: string[];
};

export type ParsedDocument = {
  doc_id: string;
  doc_title: string;
  doc_type: string;
  approved_date: string;
  articles: DocumentArticle[];
};
