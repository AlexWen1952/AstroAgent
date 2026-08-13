export interface Translations {
  nav: {
    back: string;
    myReadings: string;
    startNew: string;
    language: string;
  };
  home: {
    appName: string;
    appNameChinese: string;
    tagline: string;
    selectLanguage: string;
    englishButton: string;
    chineseButton: string;
  };
  topic: {
    heading: string;
    subheading: string;
    continue: string;
  };
  concern: {
    heading: string;
    subheading: string;
    placeholder: string;
    charactersRemaining: string;
    continue: string;
    crisisBanner: string;
    crisisLink: string;
    dismissBanner: string;
  };
  emotion: {
    heading: string;
    subheading: string;
    continue: string;
  };
  ritual: {
    heading: string;
    prompt: string;
    ready: string;
    waiting: string;
  };
  draw: {
    heading: string;
    instruction: string;
    readReflection: string;
  };
  reading: {
    symbolDrawn: string;
    sectionLabels: {
      emotionalMirror: string;
      symbolMeaning: string;
      possibleBlindSpot: string;
      reflectionQuestions: string;
      oneActionForToday: string;
      closingLine: string;
    };
    saveButton: string;
    savedConfirmation: string;
    startNew: string;
    safetyFooter: string;
    legalFooter: string;
  };
  history: {
    heading: string;
    empty: string;
    startFirst: string;
    savedOn: string;
    backToHome: string;
  };
  historyDetail: {
    savedBanner: string;
    originalConcern: string;
    deleteButton: string;
    /** Question shown in the inline confirmation prompt. */
    deleteConfirm: string;
    /** Label for the confirm-action button inside the inline confirmation prompt. */
    deleteConfirmAction: string;
    deleteCancel: string;
    backToHistory: string;
  };
  errors: {
    localStorageUnavailable: string;
    localStorageFull: string;
    sessionExpired: string;
    readingNotFound: string;
  };
  progress: {
    stepOf: string;
  };
  ai: {
    /** Button shown when AI is available and not yet triggered. */
    personalizeButton: string;
    /** Button label while the AI call is in flight. */
    personalizing: string;
    /** Toggle label — currently showing personalized view. */
    viewingPersonalized: string;
    /** Toggle label — currently showing original view. */
    viewingOriginal: string;
    /** Small badge on the toggle pill identifying the personalized state. */
    personalizedBadge: string;
    /** Shown on the history detail page when a saved reading has an AI narrative. */
    savedPersonalized: string;
    /** Inline error when the AI call fails. */
    error: string;
    /** Shown when AI is not configured on this deployment. */
    unavailable: string;
  };
}
