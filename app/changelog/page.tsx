import type { Metadata } from 'next';
import { ChangelogView } from './view';

export const metadata: Metadata = {
  title: 'drank changelog · Domain Rating Watch',
  description: 'Verified updates to drank, the browser-local Domain Rating tracker.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'drank changelog · Domain Rating Watch',
    description: 'Verified updates to drank, the browser-local Domain Rating tracker.',
    url: 'https://domains.sassmaker.com/changelog',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'drank changelog · Domain Rating Watch',
    description: 'Verified updates to drank, the browser-local Domain Rating tracker.',
  },
};

export default function ChangelogPage() {
  return <ChangelogView />;
}
