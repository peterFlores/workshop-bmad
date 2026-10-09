import { Button } from '@heroui/react';

type Props = {
  isFavorite: boolean;
  onToggle: () => void;
  isDisabled?: boolean;
  describedBy?: string;
};

export function HeartButton({ isFavorite, onToggle, isDisabled = false, describedBy }: Props) {
  return (
    <Button
      variant="ghost"
      isIconOnly
      isDisabled={isDisabled}
      onPress={onToggle}
      aria-label="Favorite this quote"
      aria-pressed={isFavorite}
      aria-describedby={describedBy}
      className={`min-h-[44px] min-w-[44px] shrink-0 ${isFavorite ? 'text-accent' : 'text-muted'}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </Button>
  );
}
