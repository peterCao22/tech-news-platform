
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  emailVerified: 'emailVerified',
  name: 'name',
  image: 'image',
  role: 'role',
  status: 'status',
  password: 'password',
  firstName: 'firstName',
  lastName: 'lastName',
  bio: 'bio',
  timezone: 'timezone',
  language: 'language',
  preferences: 'preferences',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastLoginAt: 'lastLoginAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires',
  createdAt: 'createdAt'
};

exports.Prisma.PasswordResetTokenScalarFieldEnum = {
  id: 'id',
  email: 'email',
  token: 'token',
  expires: 'expires',
  used: 'used',
  createdAt: 'createdAt'
};

exports.Prisma.SourceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  url: 'url',
  status: 'status',
  config: 'config',
  lastFetchAt: 'lastFetchAt',
  fetchCount: 'fetchCount',
  errorCount: 'errorCount',
  lastError: 'lastError',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContentScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  content: 'content',
  url: 'url',
  imageUrl: 'imageUrl',
  category: 'category',
  tags: 'tags',
  status: 'status',
  score: 'score',
  priority: 'priority',
  sourceId: 'sourceId',
  sourceUrl: 'sourceUrl',
  publishedAt: 'publishedAt',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  author: 'author',
  contentHash: 'contentHash',
  duplicateOf: 'duplicateOf',
  keywords: 'keywords',
  quality: 'quality',
  relevance: 'relevance',
  shareCount: 'shareCount',
  summary: 'summary',
  titleHash: 'titleHash',
  type: 'type',
  viewCount: 'viewCount',
  reviewStatus: 'reviewStatus',
  reviewedBy: 'reviewedBy',
  reviewedAt: 'reviewedAt',
  reviewNotes: 'reviewNotes',
  lastEditedBy: 'lastEditedBy',
  lastEditedAt: 'lastEditedAt'
};

exports.Prisma.TagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  type: 'type',
  description: 'description',
  color: 'color',
  parentId: 'parentId',
  usageCount: 'usageCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContentTagScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  createdAt: 'createdAt',
  relevance: 'relevance',
  tagId: 'tagId'
};

exports.Prisma.ContentReviewScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  userId: 'userId',
  action: 'action',
  comment: 'comment',
  createdAt: 'createdAt'
};

exports.Prisma.DailyDigestScalarFieldEnum = {
  id: 'id',
  date: 'date',
  title: 'title',
  summary: 'summary',
  contentIds: 'contentIds',
  totalItems: 'totalItems',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserActivityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  details: 'details',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.AITaskScalarFieldEnum = {
  id: 'id',
  type: 'type',
  status: 'status',
  input: 'input',
  output: 'output',
  error: 'error',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SystemConfigScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApiConfigurationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  provider: 'provider',
  baseUrl: 'baseUrl',
  authType: 'authType',
  status: 'status',
  apiKey: 'apiKey',
  token: 'token',
  username: 'username',
  password: 'password',
  headerName: 'headerName',
  rateLimit: 'rateLimit',
  timeout: 'timeout',
  retryAttempts: 'retryAttempts',
  retryDelay: 'retryDelay',
  headers: 'headers',
  totalCalls: 'totalCalls',
  successfulCalls: 'successfulCalls',
  failedCalls: 'failedCalls',
  lastCallAt: 'lastCallAt',
  lastError: 'lastError',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApiCallLogScalarFieldEnum = {
  id: 'id',
  configId: 'configId',
  method: 'method',
  endpoint: 'endpoint',
  requestHeaders: 'requestHeaders',
  requestBody: 'requestBody',
  statusCode: 'statusCode',
  responseHeaders: 'responseHeaders',
  responseBody: 'responseBody',
  duration: 'duration',
  success: 'success',
  errorMessage: 'errorMessage',
  createdAt: 'createdAt'
};

exports.Prisma.ContentVersionScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  version: 'version',
  title: 'title',
  description: 'description',
  contentText: 'contentText',
  summary: 'summary',
  tags: 'tags',
  metadata: 'metadata',
  changeType: 'changeType',
  changeNote: 'changeNote',
  changedBy: 'changedBy',
  createdAt: 'createdAt'
};

exports.Prisma.ContentAuditLogScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  userId: 'userId',
  action: 'action',
  tableName: 'tableName',
  recordId: 'recordId',
  oldStatus: 'oldStatus',
  newStatus: 'newStatus',
  changes: 'changes',
  notes: 'notes',
  oldValues: 'oldValues',
  newValues: 'newValues',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  sessionId: 'sessionId',
  createdAt: 'createdAt'
};

exports.Prisma.ContentDuplicationScalarFieldEnum = {
  id: 'id',
  originalId: 'originalId',
  duplicateId: 'duplicateId',
  titleSimilarity: 'titleSimilarity',
  contentSimilarity: 'contentSimilarity',
  overallSimilarity: 'overallSimilarity',
  detectionMethod: 'detectionMethod',
  confidence: 'confidence',
  status: 'status',
  reviewedBy: 'reviewedBy',
  reviewedAt: 'reviewedAt',
  createdAt: 'createdAt'
};

exports.Prisma.SearchIndexScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  titleTokens: 'titleTokens',
  contentTokens: 'contentTokens',
  keywords: 'keywords',
  titleWeight: 'titleWeight',
  contentWeight: 'contentWeight',
  keywordWeight: 'keywordWeight',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AiServiceConfigScalarFieldEnum = {
  id: 'id',
  provider: 'provider',
  name: 'name',
  apiKey: 'apiKey',
  model: 'model',
  maxTokens: 'maxTokens',
  temperature: 'temperature',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AiUsageLogScalarFieldEnum = {
  id: 'id',
  configId: 'configId',
  provider: 'provider',
  operation: 'operation',
  inputTokens: 'inputTokens',
  outputTokens: 'outputTokens',
  totalTokens: 'totalTokens',
  costUsd: 'costUsd',
  responseTimeMs: 'responseTimeMs',
  success: 'success',
  errorMessage: 'errorMessage',
  createdAt: 'createdAt'
};

exports.Prisma.AiServiceStatusScalarFieldEnum = {
  id: 'id',
  configId: 'configId',
  provider: 'provider',
  isHealthy: 'isHealthy',
  lastCheckAt: 'lastCheckAt',
  errorMessage: 'errorMessage',
  responseTimeMs: 'responseTimeMs',
  createdAt: 'createdAt'
};

exports.Prisma.GeminiNewsQueryScalarFieldEnum = {
  id: 'id',
  queryType: 'queryType',
  prompt: 'prompt',
  response: 'response',
  totalFetched: 'totalFetched',
  totalSaved: 'totalSaved',
  success: 'success',
  errorMessage: 'errorMessage',
  tokensUsed: 'tokensUsed',
  costUsd: 'costUsd',
  createdAt: 'createdAt'
};

exports.Prisma.ContentScoreScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  totalScore: 'totalScore',
  timelinessScore: 'timelinessScore',
  authorityScore: 'authorityScore',
  qualityScore: 'qualityScore',
  relevanceScore: 'relevanceScore',
  aiImportanceScore: 'aiImportanceScore',
  engagementScore: 'engagementScore',
  weightConfigId: 'weightConfigId',
  explanation: 'explanation',
  calculatedAt: 'calculatedAt'
};

exports.Prisma.ScoringWeightScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  timeliness: 'timeliness',
  authority: 'authority',
  quality: 'quality',
  relevance: 'relevance',
  aiImportance: 'aiImportance',
  engagement: 'engagement',
  isActive: 'isActive',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ABTestConfigScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  weightConfigAId: 'weightConfigAId',
  weightConfigBId: 'weightConfigBId',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  winnerConfigId: 'winnerConfigId',
  metricsA: 'metricsA',
  metricsB: 'metricsB',
  createdAt: 'createdAt'
};

exports.Prisma.DailyTop10ScalarFieldEnum = {
  id: 'id',
  date: 'date',
  status: 'status',
  summaryReport: 'summaryReport',
  categoryStats: 'categoryStats',
  totalCandidates: 'totalCandidates',
  generationTime: 'generationTime',
  generatedBy: 'generatedBy',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.Top10ItemScalarFieldEnum = {
  id: 'id',
  top10Id: 'top10Id',
  contentId: 'contentId',
  position: 'position',
  score: 'score',
  reason: 'reason',
  highlights: 'highlights',
  createdAt: 'createdAt'
};

exports.Prisma.Top10AdjustmentScalarFieldEnum = {
  id: 'id',
  top10Id: 'top10Id',
  adjustedBy: 'adjustedBy',
  action: 'action',
  contentId: 'contentId',
  oldPosition: 'oldPosition',
  newPosition: 'newPosition',
  reason: 'reason',
  createdAt: 'createdAt'
};

exports.Prisma.FilterRuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  ruleType: 'ruleType',
  status: 'status',
  priority: 'priority',
  config: 'config',
  version: 'version',
  isPublished: 'isPublished',
  publishedAt: 'publishedAt',
  publishedBy: 'publishedBy',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedBy: 'updatedBy',
  updatedAt: 'updatedAt'
};

exports.Prisma.RuleVersionScalarFieldEnum = {
  id: 'id',
  ruleId: 'ruleId',
  version: 'version',
  config: 'config',
  changeLog: 'changeLog',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.SourceListScalarFieldEnum = {
  id: 'id',
  listType: 'listType',
  sourceId: 'sourceId',
  sourceName: 'sourceName',
  sourceDomain: 'sourceDomain',
  weight: 'weight',
  reason: 'reason',
  isActive: 'isActive',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RuleAnalyticsScalarFieldEnum = {
  id: 'id',
  ruleId: 'ruleId',
  date: 'date',
  affectedCount: 'affectedCount',
  boostedCount: 'boostedCount',
  penaltyCount: 'penaltyCount',
  blockedCount: 'blockedCount',
  avgScoreBefore: 'avgScoreBefore',
  avgScoreAfter: 'avgScoreAfter',
  top10HitRate: 'top10HitRate',
  details: 'details'
};

exports.Prisma.ContentTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category',
  template: 'template',
  isActive: 'isActive',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BatchImportScalarFieldEnum = {
  id: 'id',
  fileName: 'fileName',
  importType: 'importType',
  totalItems: 'totalItems',
  successCount: 'successCount',
  failedCount: 'failedCount',
  status: 'status',
  errorLog: 'errorLog',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.UserPreferenceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  preferredLanguage: 'preferredLanguage',
  timezone: 'timezone',
  contentTypes: 'contentTypes',
  emailNotifications: 'emailNotifications',
  pushNotifications: 'pushNotifications',
  notificationFrequency: 'notificationFrequency',
  itemsPerPage: 'itemsPerPage',
  defaultSortBy: 'defaultSortBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserInterestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  category: 'category',
  name: 'name',
  weight: 'weight',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.UserFollowingScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  followType: 'followType',
  name: 'name',
  identifier: 'identifier',
  weight: 'weight',
  isActive: 'isActive',
  notifyOnNews: 'notifyOnNews',
  notifyOnPrice: 'notifyOnPrice',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SourceWeightScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  sourceId: 'sourceId',
  weight: 'weight',
  reason: 'reason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PreferenceTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category',
  isPublic: 'isPublic',
  config: 'config',
  usageCount: 'usageCount',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserBehaviorScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  eventType: 'eventType',
  contentId: 'contentId',
  duration: 'duration',
  scrollDepth: 'scrollDepth',
  deviceType: 'deviceType',
  source: 'source',
  metadata: 'metadata',
  timestamp: 'timestamp',
  sessionId: 'sessionId',
  createdAt: 'createdAt'
};

exports.Prisma.UserReadingHistoryScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  contentId: 'contentId',
  readCount: 'readCount',
  totalDuration: 'totalDuration',
  maxScrollDepth: 'maxScrollDepth',
  isCompleted: 'isCompleted',
  isBookmarked: 'isBookmarked',
  isLiked: 'isLiked',
  isShared: 'isShared',
  firstReadAt: 'firstReadAt',
  lastReadAt: 'lastReadAt'
};

exports.Prisma.UserEngagementScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  totalViews: 'totalViews',
  totalReads: 'totalReads',
  totalClicks: 'totalClicks',
  totalShares: 'totalShares',
  totalBookmarks: 'totalBookmarks',
  totalLikes: 'totalLikes',
  totalReadingTime: 'totalReadingTime',
  avgSessionTime: 'avgSessionTime',
  categoryPreferences: 'categoryPreferences',
  sourcePreferences: 'sourcePreferences',
  topicPreferences: 'topicPreferences',
  dailyActiveStreak: 'dailyActiveStreak',
  lastActiveDate: 'lastActiveDate',
  updatedAt: 'updatedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ImplicitPreferenceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  preferenceType: 'preferenceType',
  preferenceKey: 'preferenceKey',
  weight: 'weight',
  interactionCount: 'interactionCount',
  lastInteraction: 'lastInteraction',
  confidence: 'confidence',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.KeywordTrendScalarFieldEnum = {
  id: 'id',
  keyword: 'keyword',
  date: 'date',
  count: 'count',
  contentIds: 'contentIds',
  avgScore: 'avgScore',
  categories: 'categories',
  createdAt: 'createdAt'
};

exports.Prisma.CategoryTrendScalarFieldEnum = {
  id: 'id',
  category: 'category',
  date: 'date',
  count: 'count',
  avgScore: 'avgScore',
  topKeywords: 'topKeywords',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationPreferenceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  stockAlertEnabled: 'stockAlertEnabled',
  importantNewsEnabled: 'importantNewsEnabled',
  top10DigestEnabled: 'top10DigestEnabled',
  frequency: 'frequency',
  quietHoursStart: 'quietHoursStart',
  quietHoursEnd: 'quietHoursEnd',
  digestTime: 'digestTime',
  stockAlertThreshold: 'stockAlertThreshold',
  minNewsScore: 'minNewsScore',
  emailEnabled: 'emailEnabled',
  email: 'email',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  channel: 'channel',
  subject: 'subject',
  content: 'content',
  status: 'status',
  sentAt: 'sentAt',
  errorMessage: 'errorMessage',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.StockPriceHistoryScalarFieldEnum = {
  id: 'id',
  symbol: 'symbol',
  name: 'name',
  price: 'price',
  change: 'change',
  changePercent: 'changePercent',
  timestamp: 'timestamp',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.UserRole = exports.$Enums.UserRole = {
  USER: 'USER',
  EDITOR: 'EDITOR',
  ADMIN: 'ADMIN'
};

exports.UserStatus = exports.$Enums.UserStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.SourceType = exports.$Enums.SourceType = {
  RSS: 'RSS',
  API: 'API',
  AI_QUERY: 'AI_QUERY',
  EMAIL: 'EMAIL',
  MANUAL: 'MANUAL'
};

exports.SourceStatus = exports.$Enums.SourceStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ERROR: 'ERROR',
  RATE_LIMITED: 'RATE_LIMITED'
};

exports.ContentStatus = exports.$Enums.ContentStatus = {
  RAW: 'RAW',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  REVIEWED: 'REVIEWED',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
  DUPLICATE: 'DUPLICATE'
};

exports.ContentType = exports.$Enums.ContentType = {
  NEWS: 'NEWS',
  ARTICLE: 'ARTICLE',
  BLOG_POST: 'BLOG_POST',
  PRESS_RELEASE: 'PRESS_RELEASE',
  RESEARCH: 'RESEARCH',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  OTHER: 'OTHER'
};

exports.ContentReviewStatus = exports.$Enums.ContentReviewStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PUBLISHED: 'PUBLISHED'
};

exports.TagType = exports.$Enums.TagType = {
  CATEGORY: 'CATEGORY',
  TECHNOLOGY: 'TECHNOLOGY',
  COMPANY: 'COMPANY',
  STOCK: 'STOCK',
  TOPIC: 'TOPIC',
  CUSTOM: 'CUSTOM'
};

exports.ReviewAction = exports.$Enums.ReviewAction = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  EDIT: 'EDIT',
  FLAG: 'FLAG',
  PRIORITY_BOOST: 'PRIORITY_BOOST',
  PRIORITY_LOWER: 'PRIORITY_LOWER'
};

exports.ApiAuthType = exports.$Enums.ApiAuthType = {
  API_KEY: 'API_KEY',
  BEARER_TOKEN: 'BEARER_TOKEN',
  OAUTH: 'OAUTH',
  BASIC_AUTH: 'BASIC_AUTH',
  NONE: 'NONE'
};

exports.ApiConfigStatus = exports.$Enums.ApiConfigStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ERROR: 'ERROR',
  RATE_LIMITED: 'RATE_LIMITED'
};

exports.AiProvider = exports.$Enums.AiProvider = {
  GEMINI: 'GEMINI',
  CLAUDE: 'CLAUDE',
  OPENAI: 'OPENAI',
  PERPLEXITY: 'PERPLEXITY'
};

exports.Top10Status = exports.$Enums.Top10Status = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
};

exports.RuleType = exports.$Enums.RuleType = {
  KEYWORD_BOOST: 'KEYWORD_BOOST',
  KEYWORD_PENALTY: 'KEYWORD_PENALTY',
  SOURCE_WHITELIST: 'SOURCE_WHITELIST',
  SOURCE_BLACKLIST: 'SOURCE_BLACKLIST',
  CATEGORY_BOOST: 'CATEGORY_BOOST',
  CATEGORY_PENALTY: 'CATEGORY_PENALTY',
  CUSTOM: 'CUSTOM'
};

exports.RuleStatus = exports.$Enums.RuleStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED'
};

exports.ListType = exports.$Enums.ListType = {
  WHITELIST: 'WHITELIST',
  BLACKLIST: 'BLACKLIST'
};

exports.FollowType = exports.$Enums.FollowType = {
  COMPANY: 'COMPANY',
  STOCK: 'STOCK',
  PERSON: 'PERSON',
  ORGANIZATION: 'ORGANIZATION'
};

exports.BehaviorEventType = exports.$Enums.BehaviorEventType = {
  VIEW: 'VIEW',
  CLICK: 'CLICK',
  READ: 'READ',
  SHARE: 'SHARE',
  BOOKMARK: 'BOOKMARK',
  LIKE: 'LIKE',
  SEARCH: 'SEARCH',
  COMMENT: 'COMMENT'
};

exports.NotificationFrequency = exports.$Enums.NotificationFrequency = {
  REALTIME: 'REALTIME',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  OFF: 'OFF'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  STOCK_ALERT: 'STOCK_ALERT',
  IMPORTANT_NEWS: 'IMPORTANT_NEWS',
  TOP10_DIGEST: 'TOP10_DIGEST'
};

exports.NotificationChannel = exports.$Enums.NotificationChannel = {
  EMAIL: 'EMAIL',
  WEB_PUSH: 'WEB_PUSH',
  SMS: 'SMS'
};

exports.NotificationStatus = exports.$Enums.NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  PasswordResetToken: 'PasswordResetToken',
  Source: 'Source',
  Content: 'Content',
  Tag: 'Tag',
  ContentTag: 'ContentTag',
  ContentReview: 'ContentReview',
  DailyDigest: 'DailyDigest',
  UserActivity: 'UserActivity',
  AITask: 'AITask',
  SystemConfig: 'SystemConfig',
  ApiConfiguration: 'ApiConfiguration',
  ApiCallLog: 'ApiCallLog',
  ContentVersion: 'ContentVersion',
  ContentAuditLog: 'ContentAuditLog',
  ContentDuplication: 'ContentDuplication',
  SearchIndex: 'SearchIndex',
  AiServiceConfig: 'AiServiceConfig',
  AiUsageLog: 'AiUsageLog',
  AiServiceStatus: 'AiServiceStatus',
  GeminiNewsQuery: 'GeminiNewsQuery',
  ContentScore: 'ContentScore',
  ScoringWeight: 'ScoringWeight',
  ABTestConfig: 'ABTestConfig',
  DailyTop10: 'DailyTop10',
  Top10Item: 'Top10Item',
  Top10Adjustment: 'Top10Adjustment',
  FilterRule: 'FilterRule',
  RuleVersion: 'RuleVersion',
  SourceList: 'SourceList',
  RuleAnalytics: 'RuleAnalytics',
  ContentTemplate: 'ContentTemplate',
  BatchImport: 'BatchImport',
  UserPreference: 'UserPreference',
  UserInterest: 'UserInterest',
  UserFollowing: 'UserFollowing',
  SourceWeight: 'SourceWeight',
  PreferenceTemplate: 'PreferenceTemplate',
  UserBehavior: 'UserBehavior',
  UserReadingHistory: 'UserReadingHistory',
  UserEngagement: 'UserEngagement',
  ImplicitPreference: 'ImplicitPreference',
  KeywordTrend: 'KeywordTrend',
  CategoryTrend: 'CategoryTrend',
  NotificationPreference: 'NotificationPreference',
  NotificationLog: 'NotificationLog',
  StockPriceHistory: 'StockPriceHistory'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
