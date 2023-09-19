import {
  createStorageWriter,
  StorageCategory,
} from '@telia-ace/widget-services';
import { uuid } from '@telia-ace/widget-utilities';
import { Container, EventManager, Widget } from '@webprovisions/platform';
import HttpClient from './http-client';
import Store from './store';
import { MessageGroup, ServerEntry } from './types';
import {
  createGroup,
  getKnowledgeBotEndpoint,
  setServiceClientParameter,
} from './utils';
import { ComponentNodeController } from '@telia-ace/widget-core';
import { ConversationMessageListItemType } from '@telia-ace/widget-conversation-flamingo';

class KnowledgeBotProvider {
  private agent: any;
  private user: any;
  private httpClient: HttpClient;
  private events: EventManager;
  private groups: MessageGroup[] = [];
  private store: Store;

  constructor(
    private container: Container,
    private conversation: any,
    component: ComponentNodeController
  ) {
    const { events } = this.container.get('$widget') as Widget;
    this.events = events;
    this.store = new Store(container);
    this.agent = conversation.createAgent({
      id: 'knowledge-bot-agent', // we need to specify an ID here to allow rehydration to work
      name: '',
      avatar: undefined,
    });
    this.user = conversation.user;
    const endpoint = getKnowledgeBotEndpoint(container, component);
    this.httpClient = new HttpClient(
      endpoint,
      events,
      this.store,
      this.container
    );

    this.events.subscribe(
      'provider:widget-entry',
      (_event, data: ServerEntry['content']) => {
        this.onWidgetEntryReceived(data);
      }
    );

    this.events.subscribe(
      'provider:open-contact-method',
      async (
        _event,
        data: { contactMethod: any; entryId: string; actionKey: string }
      ) => {
        const response = await this.httpClient.showContactMethodAction(data);

        if (response) {
          if (data.contactMethod.title) {
            this.printUserMessage(data.contactMethod.title);
          }
          this.onMessagesReceived(response);
        }
      }
    );
  }

  async initialize() {
    const loader = this.conversation.loading();

    const storedMeta = await this.store.read('meta');
    if (storedMeta?.agent) {
      this.agent.update({
        name: storedMeta.agent.name,
        avatar: storedMeta.agent.avatar,
      });
    }

    const rehydrated = await this.conversation.isRehydrated();

    const response = await this.httpClient.start({
      silent: this.conversation.options?.silent || rehydrated,
    });
    if (response) {
      this.onMessagesReceived(response);
    }

    loader();
  }

  async onMessagesReceived(groups: MessageGroup[]) {
    this.groups = this.groups.concat(groups);
    groups.forEach((group) => {
      const items = group.items.map((item) => item.message);
      if (group.isUser) {
        group.writer = this.user.print(items);
      } else {
        group.writer = this.agent.print(items);
      }
    });
  }

  async onInput(
    action: string | { [key: string]: any; actionKey: string; label?: string }
  ) {
    const actionKey = typeof action === 'string' ? action : action.actionKey;

    switch (actionKey) {
      case 'next':
        {
          if (typeof action === 'string') {
            return;
          }
          const group = this.groups.find(
            (other) => other.id === action.data?.groupId
          );

          if (group) {
            const response = await this.httpClient.nextAction(group);
            if (response) {
              const combined = response.items.map((item) => item.message);
              group.meta.paging = response?.meta.paging;
              group.writer.update(combined);
            }
          }
        }
        break;
      case 'help':
        {
          const loader = this.conversation.loading();

          const response = await this.httpClient.helpAction();
          loader();
          if (response) {
            this.onMessagesReceived(response);
          }
        }
        break;
      default:
        {
          if (typeof action !== 'string' && action.label) {
            this.printUserMessage(action.label);
          }
          const loader = this.conversation.loading();
          const response = await this.httpClient.defaultAction(actionKey);
          if (response) {
            this.onMessagesReceived(response);
          }
          loader();
        }
        break;
    }
  }

  private printUserMessage(message: string) {
    const group = createGroup({
      isUser: true,
      items: [
        {
          id: uuid(),
          isUser: true,
          message: [ConversationMessageListItemType.HTML, { body: message }],
        },
      ],
    });
    this.onMessagesReceived([group]);
    return group;
  }

  async onMessageSend(message: string) {
    const loader = this.conversation.loading();
    const response = await this.httpClient.sendMessage(message);

    await setServiceClientParameter(this.container, 'phrase', message);

    this.printUserMessage(message);

    if (response) {
      this.onMessagesReceived(response);
    }
    loader();
  }

  private async onWidgetEntryReceived(data: ServerEntry['content']) {
    if (data.agent) {
      const agentSettings = {
        name: data.agent.name,
        avatar: data.agent.avatar,
      };
      this.agent.update(agentSettings);
      const write = await createStorageWriter(
        this.container,
        'bot-provider-conversation-meta',
        StorageCategory.Necessary
      );
      write({
        agent: agentSettings,
      });
    }
  }
}

export default KnowledgeBotProvider;
