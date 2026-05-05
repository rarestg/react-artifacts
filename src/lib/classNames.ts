import { twMerge } from 'tailwind-merge';

type ClassNameValue = string | false | null | undefined;

// Use for real class composition; keep single static className strings literal.
export function mergeClassNames(...classNames: ClassNameValue[]) {
  return twMerge(classNames.filter(Boolean).join(' '));
}
