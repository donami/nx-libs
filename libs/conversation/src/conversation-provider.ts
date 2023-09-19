import {
  Container,
  EventListener,
  EventObject,
  EventSubscriptionCancellation,
} from '@webprovisions/platform';
import { Agent, AgentSettings } from './agent';
import {
  CancelLoaderDelegate,
  ConversationController,
  ConversationEntry,
  ConversationMessageType,
  ConversationOptions,
} from './conversation-controller';
import {
  ConversationMessageContent,
  ConversationMessageSender,
  ConversationMessageSettings,
} from './types';

export class ConversationProvider {
  private subscriptions: EventSubscriptionCancellation[] = [];
  public options: ConversationOptions;
  public user: any;

  private constructor(
    public name: string,
    _container: Container,
    public controller: ConversationController | null
  ) {
    this.user = controller?.user;
    this.options = {
      silent: false,
    };
  }

  static create(
    name: string,
    container: Container,
    controller: ConversationController
  ) {
    return new ConversationProvider(name, container, controller);
  }

  createAgent(settings: AgentSettings = {}): Agent | undefined {
    if (this.controller) {
      const storedAgent = this.controller.getAgentById(settings.id);

      const agent = storedAgent
        ? new Agent(this, { ...storedAgent, ...settings })
        : new Agent(this, settings);
      if (!storedAgent) {
        this.controller?.events.dispatch('conversation:agent-created', {
          agent,
        });
      }
      return agent;
    }
  }

  print(
    settings: string | ConversationMessageSettings
  ): ConversationEntry | undefined {
    return this.controller?.print(settings);
  }

  setTypingState(
    sender: ConversationMessageSender,
    type?: ConversationMessageType
  ) {
    return this.controller?.setTypingState(sender, type);
  }

  loading(): CancelLoaderDelegate {
    if (!this.controller) {
      return () => () => {
        //
      };
    }
    return this.controller.loader();
  }

  createEntry(
    key: string,
    content: ConversationMessageContent,
    type: ConversationMessageType,
    sender?: ConversationMessageSender,
    timestamp?: number | null
  ) {
    return this.controller?.createEntry(key, content, type, sender, timestamp);
  }

  dispose() {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`conversation-provider: dispose (${this.name})`);
    }
    this.controller?.disposeProvider(this);
    this.controller = null;
    this.subscriptions.forEach((unsub) => unsub());
  }

  isRehydrated() {
    return this.controller?.isRehydrated() || Promise.resolve(false);
  }

  getHistory() {
    return this.controller?.getHistory() || [];
  }

  complete() {
    this.controller?.onCompleteProvider();
  }

  setOptions(options: ConversationOptions = { silent: false }) {
    this.options = options;
  }

  onUnreadMessage(fn: EventListener): EventSubscriptionCancellation | void {
    if (this.controller) {
      const unsubscribe = this.controller?.onUnreadMessage(fn);
      this.subscriptions.push(unsubscribe);
      return () => {
        unsubscribe();
      };
    }
  }

  onMounted(fn: EventListener): EventSubscriptionCancellation | void {
    if (this.controller) {
      const unsubscribe = this.controller?.events.subscribe(
        'conversation:component-mount-changed',
        fn
      );
      this.subscriptions.push(unsubscribe);
      fn({} as EventObject, this.controller.getComponentMountedState());
      return () => {
        unsubscribe();
      };
    }
  }
}

export default ConversationProvider;
