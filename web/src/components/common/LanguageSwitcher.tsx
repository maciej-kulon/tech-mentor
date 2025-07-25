// ═══════════════════════════════════════════════════════════════
// LANGUAGE SWITCHER COMPONENT - Allows users to change app language
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { useTranslation } from "react-i18next";

// ═══════════════════════════════════════════════════════════════
// LANGUAGE SWITCHER COMPONENT
// ═══════════════════════════════════════════════════════════════

export const LanguageSwitcher: React.FC = () => {
  // useTranslation hook provides access to translation functions
  const { t, i18n } = useTranslation();

  // ═══════════════════════════════════════════════════════════════
  // EVENT HANDLERS - Handle language switching
  // ═══════════════════════════════════════════════════════════════

  // Function to handle language change
  const handleLanguageChange = (language: string) => {
    // Change the language using i18n.changeLanguage
    // This will automatically update all translated text in the app
    i18n.changeLanguage(language);
  };

  // ═══════════════════════════════════════════════════════════════
  // JSX RETURN - Language switcher UI
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="language-switcher">
      {/* Language switcher container */}
      <div className="language-switcher-container">
        {/* Current language indicator */}
        <span className="language-label">{t("language.switchLanguage")}:</span>

        {/* Language buttons */}
        <div className="language-buttons">
          {/* English button */}
          <button
            type="button"
            className={`language-button ${i18n.language === "en" ? "active" : ""}`}
            onClick={() => handleLanguageChange("en")}
            aria-label="Switch to English"
          >
            {t("language.en")}
          </button>

          {/* Polish button */}
          <button
            type="button"
            className={`language-button ${i18n.language === "pl" ? "active" : ""}`}
            onClick={() => handleLanguageChange("pl")}
            aria-label="Switch to Polish"
          >
            {t("language.pl")}
          </button>
        </div>
      </div>

      {/* CSS styles for the language switcher */}
      <style>{`
        .language-switcher {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        .language-switcher-container {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .language-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 500;
        }

        .language-buttons {
          display: flex;
          gap: 4px;
        }

        .language-button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.8);
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 40px;
        }

        .language-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5);
          color: white;
        }

        .language-button.active {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.6);
          color: white;
          font-weight: 600;
        }

        .language-button:focus {
          outline: 2px solid rgba(255, 255, 255, 0.5);
          outline-offset: 2px;
        }

        /* Responsive design for smaller screens */
        @media (max-width: 768px) {
          .language-switcher {
            top: 10px;
            right: 10px;
          }

          .language-switcher-container {
            padding: 6px 8px;
          }

          .language-label {
            font-size: 12px;
          }

          .language-button {
            font-size: 11px;
            padding: 3px 6px;
            min-width: 35px;
          }
        }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HOW TO USE THIS COMPONENT:
// ═══════════════════════════════════════════════════════════════

/*
1. Import the component:
   import { LanguageSwitcher } from './components/common/LanguageSwitcher';

2. Add it to your main App component or layout:
   function App() {
     return (
       <div>
         <LanguageSwitcher />
         // Your other components
       </div>
     );
   }

3. The component will automatically:
   - Show the current language
   - Allow switching between English and Polish
   - Persist language preference in localStorage
   - Update all translated text immediately when language changes

4. Features:
   - Fixed position in top-right corner
   - Responsive design for mobile devices
   - Smooth hover and focus effects
   - Accessible with proper ARIA labels
   - Glass morphism design that fits modern UI
*/

// ═══════════════════════════════════════════════════════════════
// KEY REACT I18N CONCEPTS DEMONSTRATED:
// ═══════════════════════════════════════════════════════════════

/*
1. useTranslation Hook:
   - Provides t() function for translations
   - Provides i18n object for language management
   - Automatically re-renders when language changes

2. Language Switching:
   - i18n.changeLanguage() changes the active language
   - All components using t() automatically update
   - Language preference is saved to localStorage

3. Translation Keys:
   - Organized in nested structure (language.switchLanguage)
   - Supports interpolation for dynamic content
   - Fallback to English if translation missing

4. Component Design:
   - Reusable across the entire application
   - Consistent styling with the app theme
   - Accessible and responsive design
*/
