import type { Translations } from './types';

export const en: Translations = {
  nav: {
    back: 'Back',
    myReadings: 'My Readings',
    startNew: 'Start a New Reading',
    language: 'Language',
  },
  home: {
    appName: 'Heart Symbol',
    appNameChinese: '心符',
    tagline: 'A quiet space to reflect on what is weighing on your heart.',
    selectLanguage: 'Choose your language to begin.',
    englishButton: 'English',
    chineseButton: '中文',
  },
  topic: {
    heading: 'What is weighing on your heart?',
    subheading: 'Choose the area that feels most present right now.',
    continue: 'Continue',
  },
  concern: {
    heading: 'Describe what is on your mind.',
    subheading: 'Up to 300 characters. No one else will see this.',
    placeholder: 'Write what you are carrying right now…',
    charactersRemaining: '{n} characters remaining',
    continue: 'Continue',
    crisisBanner:
      'We noticed something that sounds painful. If you are going through something serious, please consider reaching out to a crisis helpline or emergency services in your area. You can find local resources at findahelpline.com.',
    crisisLink: 'findahelpline.com',
    dismissBanner: 'Close',
  },
  emotion: {
    heading: 'How are you feeling right now?',
    subheading: 'Choose the feeling that is most present.',
    continue: 'Continue',
  },
  ritual: {
    heading: 'A moment before we begin.',
    prompt:
      'Close your eyes for a moment.\nTake one slow breath.\nHold in your mind what you wrote.\nWhen you feel ready, draw your Symbol.',
    ready: 'I\'m ready',
    waiting: 'Take a breath…',
  },
  draw: {
    heading: 'Draw your Symbol',
    instruction: 'Tap any card to reveal your Symbol for today.',
    readReflection: 'Read your reflection',
  },
  reading: {
    symbolDrawn: 'Your Symbol',
    sectionLabels: {
      emotionalMirror: 'Emotional Mirror',
      symbolMeaning: 'Symbol Meaning',
      possibleBlindSpot: 'Possible Blind Spot',
      reflectionQuestions: 'Reflection Questions',
      oneActionForToday: 'One Action for Today',
      closingLine: 'A Closing Thought',
    },
    saveButton: 'Save this reading',
    savedConfirmation: 'Saved to your readings.',
    startNew: 'Start a new reading',
    safetyFooter:
      'Heart Symbol is a reflection tool, not a medical, psychological, legal, or financial service. If you are in crisis or need professional support, please reach out to a qualified professional or a crisis helpline in your area.',
    legalFooter:
      'Heart Symbol is for personal reflection only. It is not a substitute for professional medical, psychological, legal, or financial advice.',
  },
  history: {
    heading: 'My Readings',
    empty: 'You have not saved any readings yet.',
    startFirst: 'Start your first reading',
    savedOn: 'Saved on {date}',
    backToHome: 'Back to Home',
  },
  historyDetail: {
    savedBanner: 'Saved on {date}',
    originalConcern: 'Original concern',
    deleteButton: 'Delete this reading',
    deleteConfirm: 'Delete this reading permanently?',
    deleteConfirmAction: 'Delete',
    deleteCancel: 'Cancel',
    backToHistory: 'Back to My Readings',
  },
  errors: {
    localStorageUnavailable:
      'Your device does not support local saving. Your reading will not be saved.',
    localStorageFull:
      'Your saved readings are full. Please delete an older reading to save this one.',
    sessionExpired: 'Your session has ended. Starting a new reading.',
    readingNotFound: 'Reading not found.',
  },
  progress: {
    stepOf: '{step} / {total}',
  },
  ai: {
    personalizeButton: 'Make it personal',
    personalizing: 'Personalizing…',
    viewingPersonalized: 'Personalized ✦',
    viewingOriginal: 'Original',
    personalizedBadge: 'Personalized',
    savedPersonalized: 'This reading was personalized.',
    error: 'Could not personalize. Showing original reading.',
    unavailable: 'AI personalization is not configured on this deployment.',
  },
};
