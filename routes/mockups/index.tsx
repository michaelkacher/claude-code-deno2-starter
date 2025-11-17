import type { PageProps } from 'fresh';

export default function MockupsIndex(props: PageProps) {
  return (
    <div class='min-h-screen p-8'>
      <h1 class='text-3xl font-bold mb-4'>UI Mockups</h1>
      <p>No mockups yet. Create one with /mockup command.</p>
    </div>
  );
}

