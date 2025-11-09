/**
 * Site Configuration
 * Centralized configuration for the Deno 2 Starter template
 * 
 * Customize these values to brand your application
 */

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
  adminOnly?: boolean;
  requiresAuth?: boolean;
}

export interface SiteConfig {
  // Site Identity
  site: {
    name: string;
    description: string;
    url: string;
    logo?: string;
  };

  // Navigation Configuration
  navigation: {
    primary: NavigationItem[];
    mobile: NavigationItem[];
    footer?: NavigationItem[];
  };

  // Brand Colors & Theme
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };

  // Feature Flags
  features: {
    enableNotifications: boolean;
    enableTwoFactor: boolean;
    enableFileUpload: boolean;
    enableAdminPanel: boolean;
    enableDarkMode: boolean;
  };

  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };

  // Social Links
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    discord?: string;
  };
}

// Default Configuration
export const defaultConfig: SiteConfig = {
  site: {
    name: "Deno 2 Starter",
    description: "A modern full-stack application starter with Deno 2 and Fresh",
    url: "http://localhost:3000",
  },

  navigation: {
    primary: [
      // {
      //   label: "Home",
      //   href: "/",
      //   icon: "🏠",
      // },
      // {
      //   label: "Design System",
      //   href: "/design-system",
      //   icon: "🎨",
      // },
    //   {
    //     label: "Documentation",
    //     href: "/docs",
    //     icon: "📚",
    //   },
    ],
    mobile: [
      {
        label: "Home",
        href: "/",
        icon: "🏠",
      },
      {
        label: "Design System",
        href: "/design-system",
        icon: "🎨",
      },
      {
        label: "Documentation",
        href: "/docs",
        icon: "📚",
      },
    ],
    footer: [
      {
        label: "Privacy Policy",
        href: "/privacy",
      },
      {
        label: "Terms of Service",
        href: "/terms",
      },
      {
        label: "Contact",
        href: "/contact",
      },
    ],
  },

  theme: {
    primary: "#2563eb", // blue-600
    secondary: "#64748b", // slate-500
    accent: "#7c3aed", // violet-600
    background: "#ffffff",
    surface: "#f8fafc", // slate-50
  },

  features: {
    enableNotifications: true,
    enableTwoFactor: true,
    enableFileUpload: true,
    enableAdminPanel: true,
    enableDarkMode: true,
  },

  api: {
    baseUrl: "/api",
    timeout: 10000,
    retries: 3,
  },

  social: {
    github: "https://github.com/your-username/your-repo",
    twitter: "https://twitter.com/your-handle",
  },
};

// Environment-specific overrides
// Only run on server-side where Deno is available
const getEnvironmentConfig = (): Partial<SiteConfig> => {
  // Check if we're in a browser environment (Deno is only available server-side)
  if (typeof Deno === 'undefined') {
    return {}; // Return empty config in browser, use defaults
  }
  
  const env = Deno.env.get("DENO_ENV") || "development";

  switch (env) {
    case "production":
      return {
        site: {
          ...defaultConfig.site,
          url: Deno.env.get("FRONTEND_URL") || "https://your-domain.com",
        },
        api: {
          ...defaultConfig.api,
          baseUrl: Deno.env.get("API_URL") || "https://api.your-domain.com",
        },
      };

    case "staging":
      return {
        site: {
          ...defaultConfig.site,
          name: `${defaultConfig.site.name} (Staging)`,
          url: Deno.env.get("FRONTEND_URL") || "https://staging.your-domain.com",
        },
        api: {
          ...defaultConfig.api,
          baseUrl: Deno.env.get("API_URL") || "https://api-staging.your-domain.com",
        },
      };

    default: // development
      return {};
  }
};

// Merge default config with environment-specific overrides
export const siteConfig: SiteConfig = {
  ...defaultConfig,
  ...getEnvironmentConfig(),
};

// Helper functions for accessing config
export const getSiteName = () => siteConfig.site.name;
export const getSiteUrl = () => siteConfig.site.url;
export const getNavigationItems = () => siteConfig.navigation.primary;
export const getMobileNavigationItems = () => siteConfig.navigation.mobile;
export const getTheme = () => siteConfig.theme;
export const getFeatures = () => siteConfig.features;
export const getApiConfig = () => siteConfig.api;
