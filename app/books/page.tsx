import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getBooksData } from "@/lib/data/books";
import { getQueryClient } from "@/lib/query/client";
import { qk } from "@/lib/query/keys";
import { getCurrentUserId } from "@/lib/user";
import { BooksView } from "./books-view";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const userId = await getCurrentUserId();

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.books,
    queryFn: () => getBooksData(userId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BooksView />
    </HydrationBoundary>
  );
}
