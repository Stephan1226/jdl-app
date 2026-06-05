import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getBooksData, type BookListResult } from "@/lib/data/books";
import { getQueryClient } from "@/lib/query/client";
import { qk } from "@/lib/query/keys";
import { getCurrentUserId } from "@/lib/user";
import { BooksView } from "../books-view";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const userId = await getCurrentUserId();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: qk.books({}),
    queryFn: ({ pageParam }) =>
      getBooksData(userId, { page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: BookListResult) =>
      lastPage.hasMore ? 1 : undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BooksView />
    </HydrationBoundary>
  );
}
