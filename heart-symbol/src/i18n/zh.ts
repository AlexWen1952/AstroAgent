import type { Translations } from './types';

export const zh: Translations = {
  nav: {
    back: '返回',
    myReadings: '我的心符记录',
    startNew: '开始新的心符',
    language: '语言',
  },
  home: {
    appName: 'Heart Symbol',
    appNameChinese: '心符',
    tagline: '一个安静的空间，让你回望心中所挂念的事。',
    selectLanguage: '请选择你的语言。',
    englishButton: 'English',
    chineseButton: '中文',
  },
  topic: {
    heading: '你心里在挂念什么？',
    subheading: '选择此刻最困扰你的领域。',
    continue: '继续',
  },
  concern: {
    heading: '说说你现在的困惑。',
    subheading: '最多 300 字。只有你能看到。',
    placeholder: '写下你现在的感受……',
    charactersRemaining: '还可输入 {n} 字',
    continue: '继续',
    crisisBanner:
      '我们注意到你分享的内容听起来很沉重。如果你正处于危机中，请联系当地的危机热线或紧急救助服务。你可以在 findahelpline.com 查找当地资源。',
    crisisLink: 'findahelpline.com',
    dismissBanner: '关闭',
  },
  emotion: {
    heading: '你现在的感受是？',
    subheading: '选择此刻最强烈的情绪。',
    continue: '继续',
  },
  ritual: {
    heading: '在开始之前，停留片刻。',
    prompt:
      '闭上眼睛片刻。\n缓缓呼吸一次。\n把你写下的那些话放在心里。\n当你准备好了，就来抽取你的心符。',
    ready: '我准备好了',
    waiting: '缓缓呼吸……',
  },
  draw: {
    heading: '抽取你的心符',
    instruction: '轻触任意一张牌，揭示今日的心符。',
    readReflection: '阅读你的心符解读',
  },
  reading: {
    symbolDrawn: '你的心符',
    sectionLabels: {
      emotionalMirror: '情绪镜像',
      symbolMeaning: '心符含义',
      possibleBlindSpot: '可能的盲点',
      reflectionQuestions: '思考问题',
      oneActionForToday: '今日一行动',
      closingLine: '结语',
    },
    saveButton: '保存此次心符',
    savedConfirmation: '已保存到记录。',
    startNew: '开始新的心符',
    safetyFooter:
      '心符是一款冥想和自我反思工具，不是医疗、心理健康、法律或财务服务。如果你正处于危机中或需要专业支持，请联系当地的专业人员或危机热线。',
    legalFooter:
      '心符仅供个人冥想与反思，不能替代专业的医疗、心理、法律或财务建议。',
  },
  history: {
    heading: '我的心符记录',
    empty: '你还没有保存任何记录。',
    startFirst: '开始第一次心符',
    savedOn: '{date} 保存',
    backToHome: '返回首页',
  },
  historyDetail: {
    savedBanner: '{date} 保存的心符',
    originalConcern: '原始困惑',
    deleteButton: '删除此记录',
    deleteConfirm: '永久删除这条心符记录？',
    deleteConfirmAction: '删除',
    deleteCancel: '取消',
    backToHistory: '返回记录列表',
  },
  errors: {
    localStorageUnavailable: '你的设备不支持本地保存。此次记录将无法保存。',
    localStorageFull: '本地存储已满。请删除旧记录以保存新的心符。',
    sessionExpired: '当前会话已结束，即将开始新的心符。',
    readingNotFound: '未找到该记录。',
  },
  progress: {
    stepOf: '{step} / {total}',
  },
  ai: {
    personalizeButton: '个性化解读',
    personalizing: '正在个性化……',
    viewingPersonalized: '个性化版 ✦',
    viewingOriginal: '原始版',
    personalizedBadge: '已个性化',
    savedPersonalized: '此次解读已个性化。',
    error: '个性化失败，正在显示原始解读。',
    unavailable: '此部署未配置 AI 个性化功能。',
  },
};
