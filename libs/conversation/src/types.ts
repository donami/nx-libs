// import { Form, FormBuilder } from '@telia-ace/widget-forms';

export type ConversationMessageSettings = {
  key?: string;
  timestamp?: number;
  title?: string;
  body?: string;
  actions?: { [actionKey: string]: any };
  form?: (builder: any /*FormBuilder*/) => void;
  type?: string;
  items?: ConversationMessageList[];
  [key: string]: any;
};

export type NormalizedMessageSettings = {
  content: ConversationMessageContent;
  key: string;
  timestamp: number | null;
};

export type ConversationMessageList = {
  header?: string;
  itemKey: string;
  type?: ConversationMessageListType;
  items: ConversationMessageListItem[];
};

export type ConversationMessageListItem = {
  icon?: string;
  type?: ConversationMessageListItemType;
  actions?: { [actionKey: string]: any };
  form?: any /*Form*/;
  body?: string;
  key: string;
  [key: string]: any;
};

export type ConversationMessageContent = {
  title?: string;
  body?: string;
  actions?: { [actionKey: string]: any };
  items?: ConverstationMessageItem<any>[];
  form?: any /*Form*/;
  [key: string]: any;
};

export type ConverstationMessageItem<T, R = ItemPayload> = R extends [T, any]
  ? R
  : never;

export type ConversationMessageUpdateSettings = ConversationMessageContent & {
  timestamp?: number;
};

export type ConversationMessageSender = {
  name?: string;
  avatar?: string | symbol;
  id?: string;
};

export enum ConversationMessageListType {
  Ordinary = 'ordinary',
  Seperator = 'seperator',
}

export enum ConversationMessageListItemType {
  LinkList = 'link-list',
  Separator = 'separator',
  ButtonList = 'button-list',
  ItemList = 'item-list',
  Text = 'text',
  HTML = 'html',
  VideoRequest = 'video-request',
}

export type LinkListProperties = {
  header?: string;
  actions:
    | { [key: string]: string }
    | { label: string; actionKey: string; data: any }[];
};

type LinkListItem = [
  ConversationMessageListItemType.LinkList,
  LinkListProperties,
];

type TextItem = [ConversationMessageListItemType.Text, string];
type SeparatorItem = [ConversationMessageListItemType.Separator, undefined];

export type ButtonListProperties = {
  header?: string;
  actions:
    | { [key: string]: string }
    | { label: string; actionKey: string; data: any }[];
};

type ButtonListItem = [
  ConversationMessageListItemType.ButtonList,
  ButtonListProperties,
];

export type ItemListProperties = {
  header?: string;
  actions:
    | { [key: string]: string }
    | { label: string; actionKey: string; data: any }[];
};

type ItemListItem = [
  ConversationMessageListItemType.ItemList,
  ItemListProperties,
];

export type VideoRequestProperties = {
  header?: string;
  acceptLabel: string;
  declineLabel: string;
};

type VideoRequestItem = [
  ConversationMessageListItemType.VideoRequest,
  VideoRequestProperties,
];

export type HtmlProperties = {
  body: string;
};

type HtmlItem = [ConversationMessageListItemType.HTML, HtmlProperties];

type ItemPayload =
  | LinkListItem
  | TextItem
  | SeparatorItem
  | ButtonListItem
  | HtmlItem
  | VideoRequestItem
  | ItemListItem;

export type Symbol = {
  type: 'Uri' | 'Svg' | 'FontAwesome' | 'Text' | string;
  content: string;
};
