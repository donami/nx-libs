// import { FormBuilder } from '@telia-ace/widget-forms';
import { uuid } from '@telia-ace/widget-utilities';
import {
  Container,
  EventListener,
  EventManager,
  Widget,
} from '@webprovisions/platform';
import { AgentSettings } from './agent';
import { ConversationHistory } from './conversation-history';
import { ConversationProvider } from './conversation-provider';
import Store from './store';
import {
  ConversationMessageContent,
  ConversationMessageSender,
  ConversationMessageSettings,
  ConversationMessageUpdateSettings,
  ConverstationMessageItem,
  NormalizedMessageSettings,
} from './types';
import { User } from './user';
import { swapProvider } from './utils/swap-provider';
export type ValidateHandler = (formValues: {
  [key: string]: any;
}) => Promise<any>;

export type SubmitHandler = (formValues: {
  [key: string]: any;
}) => Promise<any>;

export type ConversationOptions = { silent: boolean };

export type Print = (
  content: string | ConversationMessageContent
) => ConversationEntry;

export type FormHandlers = { [key: string]: FormHandler };
export type FormHandler = { validate?: ValidateHandler; submit: SubmitHandler };

export type CancelLoaderDelegate = () => void;

export class ConversationEntry {
  constructor(private writer: EntryWriter) {}

  update(
    content:
      | string
      | ConversationMessageUpdateSettings
      | ConverstationMessageItem<any>
      | ConverstationMessageItem<any>[]
  ) {
    const normalized = this.getNormalizedSettings(content);
    // const normalized = typeof content === 'string' ? { body: content } : content;
    this.writer(<ConversationMessageUpdateSettings>normalized);
  }

  remove() {
    this.writer(null);
  }

  private getNormalizedSettings(
    content:
      | string
      | ConversationMessageUpdateSettings
      | ConverstationMessageItem<any>
      | ConverstationMessageItem<any>[]
  ) {
    if (typeof content === 'string') return { body: content };
    else if (content.length > -1 && typeof content === 'object')
      return { items: content };
    else return content;
  }
}

export enum ConversationMessageType {
  User = 'user',
  Agent = 'agent',
  System = 'system',
}

export type ConversationMessage = {
  key: string;
  timestamp: number | null;
  content: ConversationMessageContent | null;
  sender: ConversationMessageSender | null;
  type: ConversationMessageType;
};

export type EntryWriter = (
  content: ConversationMessageUpdateSettings | null
) => void;

export const getNormalizedMessageSettings = (
  settings:
    | string
    | ConversationMessageSettings
    | ConverstationMessageItem<any>
    | ConverstationMessageItem<any>[],
  options?: {
    key?: string;
  }
): NormalizedMessageSettings => {
  let content: ConversationMessageContent;
  let key = options?.key || uuid();
  let timestamp: number | null = Date.now();

  if (Array.isArray(settings) && settings.length > -1) {
    if (typeof settings[0] === 'string') {
      content = { items: [<ConverstationMessageItem<any>>settings] };
    } else {
      content = { items: <ConverstationMessageItem<any>[]>settings };
    }
  } else if (typeof settings === 'string') {
    content = { body: settings };
  } else {
    settings = <ConversationMessageSettings>settings || {};

    if (settings.type) {
      content = {
        ...(<any>settings),
      };
    } else {
      content = {
        body: settings.body,
        actions: settings.actions,
        title: settings.title,
      };
      if (settings.key) {
        key = settings.key;
      }
      if (settings.timestamp) {
        timestamp = settings.timestamp;
      }
      if (typeof settings.form === 'function') {
        // const builder = FormBuilder.create(key); // TODO:
        // settings.form(builder);
        // const builtForm = builder.get();
        // content.form = builtForm;
      }
      if (settings.timestamp === null) {
        timestamp = null;
      }
    }
  }
  return { content, key, timestamp };
};

const removeTypingState = (
  typingActors: ConversationMessageSender[],
  sender?: ConversationMessageSender
) => {
  if (!sender) {
    return;
  }
  const senderString = JSON.stringify(sender);
  const indexToRemove = typingActors.findIndex((item) => {
    return senderString === JSON.stringify(item);
  });
  if (indexToRemove > -1) {
    return typingActors.splice(indexToRemove, 1);
  }
};

/**
 * Manages the stream of messages inside a `ConversationComponent` and provides external read-write
 * access to it as well as exposing emitted actions.
 */
export class ConversationController {
  formHandlers: FormHandlers = {};

  /**
   * Represents the current end user.
   */
  user: User = new User(this);

  events: EventManager;

  providers: string[] = [];

  active = false;

  queuedProviders: string[] = [];

  registeredProviders: ConversationProvider[] = [];

  private loaders = 0;
  private componentMounted = false;

  private store: Store;

  messages: ConversationMessage[] = [];
  private typingActors: ConversationMessageSender[] = [];

  private conversationHistory: ConversationHistory;

  constructor(
    public container: Container,
    public id: string,
    options: { rehydrate: boolean }
  ) {
    const widget: Widget = container.get('$widget');
    this.events = widget.events.createChild(this);
    this.store = new Store(container, this, options.rehydrate);
    this.conversationHistory = new ConversationHistory(this);
  }

  setInitialStorage(data: { agents: AgentSettings[] }) {
    this.store.setInitialData(data);
  }

  setProviders(providers: string[]) {
    const removed: string[] = [];
    const added: string[] = [];

    // remove
    this.providers
      .reduce<string[]>((acc, provider) => {
        if (providers.indexOf(provider) === -1) {
          acc.push(provider);
        }
        return acc;
      }, [])
      .forEach((providerToRemove) => {
        const indexToRemove = this.providers.indexOf(providerToRemove);
        if (indexToRemove > -1) {
          removed.push(providerToRemove);
          this.providers.splice(indexToRemove, 1);
        }
      });

    // add
    providers.forEach((provider) => {
      if (this.providers.indexOf(provider) === -1) {
        added.push(provider);
        this.providers.push(provider);
      }
    });

    if (added.length || removed.length) {
      this.events.dispatch('conversation:providers-changed', {
        added,
        removed,
      });
    }
  }

  createProvider(name: string): ConversationProvider {
    const index = this.providerIndex(name);
    if (index > -1) {
      return this.registeredProviders[index];
    }
    const provider = ConversationProvider.create(name, this.container, this);
    this.registeredProviders.push(provider);
    return provider;
  }

  providerIndex(name: string) {
    return this.registeredProviders.findIndex((p) => p.name === name);
  }

  getAgentById(id?: string) {
    if (!id) {
      return;
    }
    return this.store.getStoredAgent(id);
  }

  dispose() {
    this.conversationHistory.dispose();
    this.registeredProviders.forEach((provider) => provider.dispose());
    this.messages = [];
    this.events.dispatch('conversation:controller-disposed', this);
    this.active = false;
  }

  onDispose(fn: EventListener) {
    return this.events.subscribe('conversation:controller-disposed', fn);
  }

  onStarted(fn: EventListener) {
    return this.events.subscribe('conversation:started', fn);
  }

  onMessageCreated(fn: EventListener) {
    return this.events.subscribe('conversation:message-created', fn);
  }

  isRehydrated() {
    return this.store.isRehydrated();
  }

  disposeProvider(target: ConversationProvider) {
    const index = this.providerIndex(target.name);
    index > -1 && this.registeredProviders.splice(index, 1);
    this.events.dispatch('conversation:providers-changed', {
      removed: [target.name],
    });
    if (!this.registeredProviders.length) {
      this.dispose();
    }
  }

  onProvidersChange(fn: EventListener) {
    return this.events.subscribe('conversation:providers-changed', fn);
  }

  setComponentMountedState(mounted: boolean) {
    if (this.componentMounted === mounted) {
      return;
    }
    this.componentMounted = mounted;
    if (mounted) {
      this.events.dispatch('conversation:unread-message', false);
      this.events.dispatch('conversation:started', true);
      this.active = true;
    }
    this.events.dispatch('conversation:component-mount-changed', mounted);
  }

  setProviderOptions(providerName: string, options: ConversationOptions) {
    const index = this.providerIndex(providerName);

    if (index > -1) {
      this.registeredProviders[index].setOptions(options);
    }
  }

  changeProvider(providerName: string) {
    const provider = this.registeredProviders.find(
      (p) => p.name === providerName
    );

    if (provider) {
      swapProvider(this.container, this.id, providerName);
    }
  }

  queueProviders(providers: string[]) {
    this.queuedProviders = providers;
  }

  onCompleteProvider() {
    const nextProvider = this.queuedProviders.pop();

    if (nextProvider) {
      swapProvider(this.container, this.id, nextProvider);
    }
  }

  getComponentMountedState() {
    return this.componentMounted;
  }

  onUnreadMessage(fn: EventListener) {
    return this.events.subscribe('conversation:unread-message', fn);
  }

  createEntry(
    key: string,
    content: ConversationMessageContent,
    type: ConversationMessageType,
    sender?: ConversationMessageSender,
    timestamp?: number | null
  ): ConversationEntry {
    const message: ConversationMessage = {
      key,
      content,
      type,
      sender: sender || null,
      timestamp: timestamp || timestamp === null ? timestamp : Date.now(),
    };
    this.messages.push(message);
    message.type === ConversationMessageType.Agent &&
      removeTypingState(this.typingActors, sender);
    const entry = new ConversationEntry((updated) => {
      if (updated !== null) {
        const { timestamp: updatedTimestamp = undefined, ...content } = updated;
        message.content = content;
        if (updatedTimestamp) {
          message.timestamp = updatedTimestamp;
        }
      } else {
        const indexToRemove = this.messages.indexOf(message);
        message.content = null;
        if (indexToRemove > -1) {
          this.messages.splice(indexToRemove, 1);
        }
      }
      this.events.dispatch('conversation:message-updated', { message });
      this.update();
    });
    this.events.dispatch('conversation:message-created', { message });
    this.update();
    if (!this.componentMounted) {
      this.events.dispatch('conversation:unread-message', true);
    }
    return entry;
  }

  print = (
    settings: string | ConversationMessageSettings
  ): ConversationEntry => {
    const normalized = getNormalizedMessageSettings(settings);

    return this.createEntry(
      normalized.key,
      normalized.content,
      ConversationMessageType.System,
      undefined,
      normalized.timestamp
    );
  };

  update() {
    this.events.dispatch('conversation:updated', {
      messages: this.messages,
      loading: this.loaders > 0,
      typingActors: this.typingActors,
    });
  }

  getMessageStream() {
    return {
      messages: this.messages,
      loading: this.loaders > 0,
      typingActors: this.typingActors,
    };
  }

  setTypingState(
    sender: ConversationMessageSender,
    _type?: ConversationMessageType
  ) {
    if (this.typingActors.indexOf(sender) === -1) {
      this.typingActors.push(sender);
      this.update();
    }

    return () => {
      removeTypingState(this.typingActors, sender);
      this.update();
    };
  }

  /**
   * Displays a loader in the conversation.
   */
  loader(): CancelLoaderDelegate {
    this.loaders = this.loaders + 1;
    let dismissed = false;
    if (this.loaders === 1) {
      this.update();
    }
    return () => {
      if (!dismissed) {
        dismissed = true;
        this.loaders = this.loaders - 1;
        if (this.loaders === 0) {
          this.update();
        }
      }
    };
  }

  submitForm(key: string, handler: SubmitHandler) {
    this.formHandlers[key] = { ...this.formHandlers[key], submit: handler };
  }

  validateForm(key: string, handler: ValidateHandler) {
    this.formHandlers[key] = { ...this.formHandlers[key], validate: handler };
  }

  getHistory() {
    return this.conversationHistory.getConversationLogs();
  }
}
