import { EventSubscriptionCancellation, Widget } from '@webprovisions/platform';
import {
  ConversationController,
  ConversationMessageType,
  getNormalizedMessageSettings,
} from './conversation-controller';
import { ConversationMessageContent, ConversationMessageSender } from './types';

type ConversationLogMessage = {
  message?: string;
  options?: string[];
  alias: string;
  source: string;
  timestamp: number | null;
};

export class ConversationHistory {
  private cache: Map<string, any> = new Map();

  private subscriptions: EventSubscriptionCancellation[] = [];

  constructor(private controller: ConversationController) {
    const { events } = controller.container.get('$widget') as Widget;

    const unsubscribe = events.subscribe('data-client:fetched', (_e, data) => {
      if (data.type === 'contact-method') {
        this.cache.set(data.response.id, data.response);
      }
    });
    this.subscriptions.push(unsubscribe);
  }

  getConversationLogs(): ConversationLogMessage[] {
    const logs = this.controller.messages.reduce<ConversationLogMessage[]>(
      (acc, message) => {
        const normalized = getNormalizedMessageSettings(message as any);
        const { content, type, sender, timestamp } = normalized.content;

        const parsed = this.parseEntry(content, type, sender, timestamp);

        if (parsed) {
          acc.push(parsed);
        }

        return acc;
      },
      []
    );

    return logs;
  }

  parseEntry(
    content: ConversationMessageContent,
    type: ConversationMessageType,
    sender?: ConversationMessageSender,
    timestamp?: any | null
  ) {
    const handle = (body: any | any[]) => {
      let options: string[] = [];
      let messagesAsList: string[] = [];

      let messageData: any;

      // the actual content could also be an array,
      if (Array.isArray(body)) {
        const [_type, data] = body;
        messageData = data;
      } else {
        messageData = body;
      }

      const message = this.createMessageContent(messageData);
      if (message.length) {
        messagesAsList = [
          ...messagesAsList,
          this.createMessageContent(messageData),
        ];
      }
      options = [...options, ...this.createMessageOptions(messageData)];

      return {
        messagesAsList,
        options,
      };
    };

    let options: string[] = [];
    let messagesAsList: string[] = [];

    // a message could be either an array or just the content itself
    if (Array.isArray(content.items)) {
      const { items } = content;
      items.forEach((item) => {
        const res = handle(item);
        options = [...options, ...res.options];
        messagesAsList = [...messagesAsList, ...res.messagesAsList];
      });
    } else {
      const res = handle(content);
      options = [...options, ...res.options];
      messagesAsList = [...messagesAsList, ...res.messagesAsList];
    }

    const result: ConversationLogMessage = {
      options: options,
      message: messagesAsList.length ? messagesAsList.join('\n') : undefined,
      source: this.createMessageSource(type),
      alias: this.createAlias(type, sender),
      timestamp,
    };

    return result;
  }

  private createMessageSource(type: ConversationMessageType) {
    return type;
  }

  private createAlias(
    type: ConversationMessageType,
    sender?: ConversationMessageSender
  ) {
    if (type === ConversationMessageType.System) {
      return 'system';
    }
    return sender?.name || 'Me';
  }

  private handleContactMethod(contactMethodId: string) {
    if (!this.cache.has(contactMethodId)) {
      return;
    }

    const method = this.cache.get(contactMethodId);

    let result = '';

    result = this.appendText(result, `${method.clientName}:`);
    result = this.appendText(result, method.title);
    if (method.description) {
      result = this.appendText(result, method.title);
    }

    return result;
  }

  private getDetails(item: any, linebreak = true) {
    if (!item) {
      return '';
    }

    const {
      header,
      title,
      label,
      description,
      text,
      html,
      body,
      contactMethodId,
    } = item;
    let result = '';

    if (contactMethodId) {
      const text = this.handleContactMethod(contactMethodId.toString());
      if (text) {
        result = this.appendText(result, text, linebreak);
      }
    }

    if (header) {
      result = this.appendText(result, header, linebreak);
    }
    if (title) {
      result = this.appendText(result, title, linebreak);
    }
    if (description) {
      result = this.appendText(result, description, linebreak);
    }
    if (text) {
      result = this.appendText(result, text, linebreak);
    }
    if (label) {
      result = this.appendText(result, label, linebreak);
    }
    if (html) {
      result = this.appendText(result, html, linebreak);
    }
    if (body) {
      if (typeof body === 'string') {
        result = this.appendText(result, body, linebreak);
      }
    }
    return result;
  }

  private createMessageContent(data: any) {
    let message = '';

    message = this.getDetails(data);

    return message;
  }

  private createMessageOptions(data: any): any[] {
    let options = [];
    let actions = [];

    if (Array.isArray(data?.actions)) {
      actions = data.actions;
    } else if (typeof data?.actions === 'object') {
      actions = Object.entries(data.actions).map(([key, value]) => {
        return {
          actionKey: key,
          label: value,
        };
      });
    }

    if (actions.length) {
      options = actions.map((option: any) => {
        return this.getDetails(option, false);
      });
    }
    return options;
  }

  private appendText(target: string, value: string, linebreak = true) {
    if (linebreak) {
      if (target.length) {
        return `${target}\n${value}`;
      }
    }
    return target.length ? `${target} ${value}` : value;
  }

  dispose() {
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
  }
}
