import { ConversationMessageListItemType } from '@telia-ace/widget-conversation-flamingo';

export enum CustomMessageTypes {
  ContactMethod = 'ace-knowledge-bot-contact-method',
  ContactList = 'ace-knowledge-bot-contact-list',
  FeedbackList = 'ace-knowledge-bot-feedback-list',
  NotificationList = 'ace-knowledge-bot-notification-list',
  NoGoodAlternative = 'ace-knowledge-bot-no-good-alternative',
}

export type LooseObject = { [key: string]: any };

export interface ActionItem {
  label: string;
  actionKey: string;
  data?: any;
  description?: string;
}

export interface MessageGroup {
  id: string;
  isUser: boolean;
  items: MessageGroupItem[];
  writer?: any;
  meta: { [key: string]: any };
}

export interface MessageGroupItem {
  id: string;
  groupId: string;
  isUser: boolean;
  message: [ConversationMessageListItemType | CustomMessageTypes, any];
}

export interface ClientEnvelope {
  command?: LooseObject;
  action?: {
    key: string;
    content: any;
  };
  globalState?: LooseObject;
  localState?: LooseObject;
  clientId?: string;
  funnel?: string;
}

export interface ServerEnvelope {
  clientId?: string | undefined;
  entries: ServerEntry[];
  globalState?: GlobalState;
  resolveCommand?: string;
  clientEnvelope?: ClientEnvelope;
}

export interface GlobalState {
  completedInteractionsCount: number;
  lastQuestion?: string;
  lastBotGuide: number;
  lastGuideTitle?: string;
  site: string;
  invincibleParameters: object;
}

export interface ServerEntry {
  id: string;
  type: string;
  content: any;
  actions: { [key: string]: any };
  tags: string[];
  relation?: string;
  timestamp: string;
  localState?: { [key: string]: any };
}

export interface ListContent {
  header?: string;
  actions: ActionItem[];
  contactMethodIds?: string[];
  entryId: string;
  groupId: string;
}
