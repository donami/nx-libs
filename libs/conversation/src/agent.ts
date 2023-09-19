import { uuid } from '@telia-ace/widget-utilities';
import {
  ConversationEntry,
  ConversationMessageType,
  getNormalizedMessageSettings,
} from './conversation-controller';
import { ConversationProvider } from './conversation-provider';
import {
  ConversationMessageSender,
  ConversationMessageSettings,
  ConverstationMessageItem,
  Symbol,
} from './types';

export type AgentSettings = {
  id?: string;
  name?: string;
  avatar?: string | symbol;
};

export class Agent {
  id: string;
  name?: string;
  avatar?: string | symbol;

  constructor(
    private provider: ConversationProvider,
    settings: AgentSettings
  ) {
    this.id = settings.id || uuid();
    this.name = settings.name;
    this.avatar = settings.avatar;
  }

  print = (
    settings:
      | string
      | ConversationMessageSettings
      | ConverstationMessageItem<any>
      | ConverstationMessageItem<any>[],
    options?: {
      key?: string;
    }
  ): ConversationEntry | undefined => {
    const sender: ConversationMessageSender = {
      name: this.name,
      avatar: this.avatar,
      id: this.id,
    };
    const normalized = getNormalizedMessageSettings(settings, options);

    return this.provider.createEntry(
      normalized.key,
      normalized.content,
      ConversationMessageType.Agent,
      sender,
      normalized.timestamp
    );
  };
  typing = () => {
    return this.provider.setTypingState({
      name: this.name,
      avatar: this.avatar,
    });
  };

  update(settings: AgentSettings): void {
    const { name, avatar } = settings;
    if (avatar === null) {
      this.avatar = undefined;
    } else if (avatar) {
      this.avatar = avatar;
    }

    if (name === null) {
      this.name = undefined;
    } else if (name) {
      this.name = name;
    }

    this.provider.controller?.events.dispatch('conversation:agent-updated', {
      agent: this,
    });
  }
}
