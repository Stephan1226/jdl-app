import "server-only";

export interface KakaoBookDocument {
  title: string;
  contents: string;
  url: string;
  isbn: string;
  datetime: string;
  authors: string[];
  publisher: string;
  translators: string[];
  price: number;
  sale_price: number;
  thumbnail: string;
  status: string;
}

export interface KakaoBookSearchMeta {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
}

export interface KakaoBookSearchResponse {
  meta: KakaoBookSearchMeta;
  documents: KakaoBookDocument[];
}

export interface BookSearchParams {
  sort?: "accuracy" | "latest";
  page?: number;
  size?: number;
  target?: "title" | "isbn" | "publisher" | "person";
}

/**
 * Daum 책 검색 API를 호출한다.
 * https://developers.kakao.com/docs/ko/daum-search/dev-guide#search-book
 */
export async function searchBooks(
  query: string,
  params?: BookSearchParams,
): Promise<KakaoBookSearchResponse> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error(
      "KAKAO_REST_API_KEY 환경 변수가 설정되지 않았습니다.",
    );
  }

  const url = new URL("https://dapi.kakao.com/v3/search/book");
  url.searchParams.set("query", query);
  if (params?.sort) url.searchParams.set("sort", params.sort);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.size) url.searchParams.set("size", String(params.size));
  if (params?.target) url.searchParams.set("target", params.target);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Daum 책 검색 API 오류 (${res.status}): ${body}`,
    );
  }

  return res.json() as Promise<KakaoBookSearchResponse>;
}
