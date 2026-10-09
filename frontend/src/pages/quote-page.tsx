import { NewQuoteButton } from '../components/new-quote-button.tsx';
import { QuoteCard } from '../components/quote-card.tsx';
import { useQuote } from '../hooks/use-quote.ts';

export function QuotePage() {
  const { quote, status, refetch } = useQuote();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="flex w-full max-w-[640px] flex-col gap-6">
        <QuoteCard quote={quote} status={status} />
        <NewQuoteButton isLoading={status === 'loading'} onPress={refetch} />
      </div>
    </main>
  );
}
