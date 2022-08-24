import type { Readability } from '@mozilla/readability';

export function readability(html: string): ReturnType<Readability['parse']>;
