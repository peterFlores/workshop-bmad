import { Button } from '@heroui/react';

type Props = { isLoading: boolean; isError?: boolean; onPress: () => void };

export function NewQuoteButton({ isLoading, isError = false, onPress }: Props) {
  return (
    <Button
      variant="primary"
      isPending={isLoading}
      onPress={onPress}
      className="min-h-[44px] w-full rounded-xl sm:w-auto sm:self-center"
    >
      {isLoading ? 'Loading...' : isError ? 'Try again' : 'New quote'}
    </Button>
  );
}
