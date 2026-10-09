import { Button } from '@heroui/react';

type Props = { isLoading: boolean; onPress: () => void };

export function NewQuoteButton({ isLoading, onPress }: Props) {
  return (
    <Button
      variant="primary"
      isPending={isLoading}
      onPress={onPress}
      className="min-h-[44px] w-full rounded-xl sm:w-auto sm:self-center"
    >
      {isLoading ? 'Loading...' : 'New quote'}
    </Button>
  );
}
