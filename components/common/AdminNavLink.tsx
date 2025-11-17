/**
 * Admin Nav Link Component
 * Reusable navigation link for admin pages
 */

interface AdminNavLinkProps {
  href: string;
  children: string;
  active?: boolean;
}

export default function AdminNavLink({ href, children, active = false }: AdminNavLinkProps) {
  const baseClasses = "px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";
  const activeClasses = active ? "font-semibold text-gray-900 dark:text-gray-100" : "";
  
  return (
    <a
      href={href}
      class={`${baseClasses} ${activeClasses}`}
    >
      {children}
    </a>
  );
}

