// ═══════════════════════════════════════════════════════════════
// INTERNATIONALIZATION (I18N) CONFIGURATION
// ═══════════════════════════════════════════════════════════════

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation resources
import enTranslations from "./locales/en.json";
import plTranslations from "./locales/pl.json";

// ═══════════════════════════════════════════════════════════════
// I18N CONFIGURATION - Setup internationalization for the app
// ═══════════════════════════════════════════════════════════════

i18n
  // Enable language detection from browser, localStorage, etc.
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Translation resources - organized by language code
    resources: {
      en: {
        translation: enTranslations,
      },
      pl: {
        translation: plTranslations,
      },
    },

    // Default language if detection fails
    fallbackLng: "en",

    // Language detection options
    detection: {
      // Order of language detection methods
      order: ["localStorage", "navigator", "htmlTag"],

      // Keys to store language preference
      lookupLocalStorage: "i18nextLng",
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,

      // Cache user language preference
      caches: ["localStorage"],

      // Don't cache language detection result
      excludeCacheFor: ["cimode"],
    },

    // Interpolation options for dynamic content
    interpolation: {
      // React already escapes by default
      escapeValue: false,
    },

    // Debug options (disable in production)
    debug: process.env.NODE_ENV === "development",

    // React i18next options
    react: {
      // Use Suspense for loading translations
      useSuspense: false,
    },
  });

export default i18n;
