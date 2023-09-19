import {
  ComponentNodeController,
  ComponentPlatform,
  ComponentQuery,
} from '@telia-ace/widget-core';
import {
  createStorageWriter,
  readStorage,
  StorageCategory,
  StorageMedium,
  StorageWriter,
} from '@telia-ace/widget-services';
import { lock } from '@telia-ace/widget-utilities';
import {
  Container,
  EventManager,
  EventSubscriptionCancellation,
  Widget,
} from '@webprovisions/platform';
import { AgentSettings } from './agent';
import { ConversationController } from './conversation-controller';
import { ConversationProvider } from './conversation-provider';
import { createSessionStorageKey } from './store';
import {
  navigateToConversation,
  openChatWidget,
  shouldPreventDefault,
} from './utils';
import { swapProvider } from './utils/swap-provider';

const STORAGE_KEY = 'conversations';

export type ConversationHandler = (
  conversation: ConversationProvider,
  component: ComponentNodeController
) => void | (() => void);

export type UnregisterControllerDelegate = () => void;

export type ConversationProviderRegistration = {
  name: string;
  handler: ConversationHandler;
};

export enum ConversationEndedBehavior {
  Deactivate = 'deactivate',
  Navigate = 'navigate',
  None = 'none',
}

export type SessionInfo = {
  id?: string;
  route?: any; // RouteData
  conversationEndedBehavior?: ConversationEndedBehavior;
};

export class ConversationPlatform {
  events: EventManager;
  public controllers: {
    conversation: ConversationController;
    component: ComponentNodeController;
  }[] = [];
  private providers: ConversationProviderRegistration[] = [];
  private disposeProviders: { [providerKey: string]: (() => void)[] } = {};
  private subscriptions: EventSubscriptionCancellation[] = [];
  private storageWriter: StorageWriter | null = null;
  // private router: RoutingService | null = null;
  private buttonQuery: ComponentQuery | null = null;
  private sessionInfo: SessionInfo | null = null;

  constructor(
    private container: Container,
    private components: ComponentPlatform
  ) {
    const widget: Widget = container.get('$widget');
    this.events = widget.events.createChild(this);
  }

  initialize() {
    createStorageWriter(
      this.container,
      STORAGE_KEY,
      StorageCategory.Necessary,
      {
        medium: StorageMedium.Local,
      }
    ).then((writer) => (this.storageWriter = writer));

    readStorage<SessionInfo>(
      this.container,
      STORAGE_KEY,
      StorageMedium.Local
    ).then((storedSession) => {
      this.buttonQuery = this.components
        .components()
        .ofType('conversation-return-button');
      if (storedSession) {
        this.sessionInfo = storedSession;
        if (storedSession.id && storedSession.route) {
          this.writeToComponents({ active: true, alert: { show: false } });
        }
      }
    });
    // this.container.getAsync('router').then((router) => (this.router = router));
    this.events.subscribe('conversation:ended', (_event, _data) => {
      switch (this.sessionInfo?.conversationEndedBehavior) {
        case ConversationEndedBehavior.Deactivate:
          // eslint-disable-next-line no-case-declarations
          const widget: Widget = this.container.get('$widget');
          widget.deactivate();
          break;
        case ConversationEndedBehavior.Navigate:
          // const initialRoute = this.router?.getInitialRoute();
          // if (initialRoute) {
          //   this.router?.navigate(initialRoute.name);
          // }
          break;
        case ConversationEndedBehavior.None:
        default:
          break;
      }
      this.writeToComponents({ active: false });
      this.sessionInfo = null;
      this.storageWriter && this.storageWriter();
    });
  }

  addSubscription(sub: EventSubscriptionCancellation) {
    this.subscriptions.push(sub);
  }

  static getInstance(
    container: Container,
    key = 'conversation'
  ): Promise<ConversationPlatform> {
    return lock(container)(() => {
      return container.getAsync(key).then((value: ConversationPlatform) => {
        let conversation = value;

        if (!conversation) {
          return ComponentPlatform.getInstance(container).then((components) => {
            conversation = new ConversationPlatform(container, components);
            conversation.initialize();
            container.registerAsync(key, () => conversation);
            return conversation;
          });
        }
        return conversation;
      });
    });
  }

  // navigateToConversationIfActive(id: string): Promise<void> {
  //   return readStorage<SessionInfo>(
  //     this.container,
  //     STORAGE_KEY,
  //     StorageMedium.Local
  //   ).then((storedSession) => {
  //     if (storedSession && storedSession.id === id) {
  //       if (storedSession.route) {
  //         const { name, params } = storedSession.route;
  //         this.router?.navigate(name, params);
  //       }
  //     }
  //   });
  // }

  setConversationEndedBehavior(behavior: ConversationEndedBehavior) {
    return readStorage<SessionInfo>(
      this.container,
      STORAGE_KEY,
      StorageMedium.Local
    ).then((stored) => {
      let storedSession = stored;
      if (storedSession) {
        storedSession.conversationEndedBehavior = behavior;
      } else {
        storedSession = { conversationEndedBehavior: behavior };
      }
      this.sessionInfo = storedSession;
      return (
        (this.storageWriter && this.storageWriter(this.sessionInfo)) ||
        Promise.resolve()
      );
    });
  }

  async createController(id: string, options: { rehydrate: boolean }) {
    const storageKey = createSessionStorageKey(id);
    const { agents: storedAgents } = (await readStorage<{
      agents: AgentSettings[];
    }>(this.container, storageKey)) || { agents: [] };

    const index = this.controllers.findIndex((c) => c.conversation.id === id);
    let controller;
    if (index > -1) {
      controller = this.controllers[index].conversation;
    } else {
      controller = new ConversationController(this.container, id, options);
    }

    controller.setInitialStorage({ agents: storedAgents || [] });
    return controller;
  }

  registerProvider(name: string, handler: ConversationHandler): void {
    const provider = {
      name,
      handler,
    };
    this.providers.push(provider);
    // execute provider for all matching controllers
    this.controllers
      .filter(
        (controller) => controller.conversation.providers.indexOf(name) > -1
      )
      .forEach((controller) => {
        this.invokeHandler(provider, controller);
      });
  }

  registerController(
    conversation: ConversationController,
    component: ComponentNodeController
  ): boolean {
    const index = this.controllers.findIndex(
      (c) => c.conversation.id === conversation.id
    );
    let controller: any;
    if (index < 0) {
      controller = { conversation, component };
      this.controllers.push(controller);
      const invokeHandlers = (providers: string[]) => {
        if (providers) {
          this.providers
            .filter((provider) => providers.indexOf(provider.name) > -1)
            .forEach((provider) => {
              this.invokeHandler(provider, controller);
            });
        }
      };

      this.subscriptions.push(
        conversation.onDispose((_event, data) => {
          const index = this.controllers.findIndex(
            (c) => c.conversation === data
          );
          index > -1 && this.controllers.splice(index, 1);
          this.components
            .components()
            .ofType('conversation-return-button')
            .select()
            .writeProperties({ active: false });

          this.events.dispatch('conversation:ended', {}, { bubbles: true });
        })
      );
      this.subscriptions.push(
        conversation.onProvidersChange((_event, data) => {
          const {
            added,
            removed = [],
          }: { added: string[]; removed: string[] } = data;
          removed.forEach((removedProvider) => {
            (this.disposeProviders[removedProvider] || []).forEach(
              (dispose) => {
                dispose();
              }
            );
          });
          invokeHandlers(added);
        })
      );

      this.subscriptions.push(
        conversation.onStarted((_event, isActive) => {
          const session: SessionInfo = {
            id: conversation.id,
            // route: this.router?.getRouteData(),
            conversationEndedBehavior:
              this.sessionInfo?.conversationEndedBehavior,
          };
          this.sessionInfo = session;
          this.storageWriter && this.storageWriter(session);

          this.writeToComponents({ active: isActive });
        })
      );

      this.subscriptions.push(
        conversation.onUnreadMessage((_event, data) => {
          this.events.dispatch('conversation:unread-message', data);
          this.writeToComponents({ alert: { show: data } });
        })
      );

      invokeHandlers(conversation.providers);
      return true;
    }
    controller = this.controllers[index];
    return false;
  }

  private writeToComponents(
    properties: any,
    _key = 'conversationReturnButtonState'
  ) {
    if (this.buttonQuery) {
      this.components.write({
        key: 'conversationReturnButtonState',
        attributes: { properties },
        target: this.buttonQuery,
        provider: 'localStorage',
      });
    }
  }

  private invokeHandler(
    provider: ConversationProviderRegistration,
    controller: any
  ) {
    const dispose = provider.handler(
      controller.conversation.createProvider(provider.name),
      controller.component
    );
    if (dispose) {
      if (!this.disposeProviders[provider.name]) {
        this.disposeProviders[provider.name] = [];
      }
      this.disposeProviders[provider.name].push(dispose);
    }
  }

  getComponentRoute() {
    return readStorage<SessionInfo>(
      this.container,
      STORAGE_KEY,
      StorageMedium.Local
    ).then((stored) => stored?.route);
  }

  dispose() {
    Object.keys(this.disposeProviders).forEach((key) => {
      this.disposeProviders[key].forEach((dispose) => {
        dispose();
      });
    });
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.controllers = [];
    this.providers = [];
  }

  public static async handleContactMethodClick(
    event: any,
    container: Container,
    contactMethod: any,
    _callback?: () => any
  ) {
    if (shouldPreventDefault(container)) {
      event.preventDefault();
      let triggerEl = document.getElementById('humany-dynamic-anchor');
      if (!triggerEl) {
        triggerEl = document.createElement('a');
        triggerEl.setAttribute('href', '#');
        triggerEl.id = 'humany-dynamic-anchor';
        document.body.appendChild(triggerEl);
      }
      openChatWidget(container, contactMethod, triggerEl);
    }
    openChatWidget(container, contactMethod);
  }

  public static async handleContactMethodSubmit(
    container: Container,
    contactMethod: any
  ) {
    if (contactMethod?.body.form.meta?.conversation?.id) {
      // if we already are in a conversational context, we always want to swap
      // the current provider instead of a route navigation
      return swapProvider(
        container,
        contactMethod.body.form.meta.conversation.id,
        contactMethod.clientName
      );
    }

    return navigateToConversation(container, contactMethod);
  }
}
