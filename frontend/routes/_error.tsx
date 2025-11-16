import { PageProps } from "fresh";

export default function ErrorPage(props: PageProps) {
  // Fresh 2 error page - try to safely access error info
  // The error might be on props directly or in various locations
  const error = (props as any).error;
  const status = error?.status || 500;
  
  if (status === 404) {
    return (
      <main class="p-8 text-center">
        <h1 class="text-4xl font-bold mb-4">404 - Page not found</h1>
        <p class="text-gray-600">The resource you requested does not exist.</p>
      </main>
    );
  }
  
  return (
    <main class="p-8 text-center">
      <h1 class="text-4xl font-bold mb-4">Something went wrong</h1>
      <p class="text-gray-600">An unexpected error occurred.</p>
    </main>
  );
}
