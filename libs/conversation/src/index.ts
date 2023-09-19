import {
  ConversationEndedBehavior,
  ConversationPlatform,
  UnregisterControllerDelegate,
} from './conversation-platform';

export { ConversationComponent } from './components/conversation/plugin';
// export { ConversationReturnButtonComponent } from './components/return-button/plugin';
export {
  ConversationController,
  ConversationEntry,
  ConversationMessageType,
} from './conversation-controller';
export type { ConversationMessage } from './conversation-controller';
export { ConversationMessageListItemType } from './types';
export type {
  ConversationMessageContent,
  ConversationMessageSender,
  ConverstationMessageItem,
} from './types';
export { registerCustomMessageComponent } from './utils/custom-message';
export { ConversationPlatform, ConversationEndedBehavior };
export type { UnregisterControllerDelegate };
