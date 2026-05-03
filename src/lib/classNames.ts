import { twMerge } from 'tailwind-merge';

type ClassNameValue = string | false | null | undefined;

export function mergeClassNames(...classNames: ClassNameValue[]) {
  return twMerge(classNames.filter(Boolean).join(' '));
}
