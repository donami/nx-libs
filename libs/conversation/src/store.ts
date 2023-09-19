import {
  createStorageWriter,
  readStorage,
  StorageCategory,
} from '@telia-ace/widget-services';
import { Container } from '@webprovisions/platform';
import { Agent, AgentSettings } from './agent';
import { ConversationController } from './conversation-controller';

type StoredConversationAgent = {
  id: string;
  name: string;
  avatar?: string;
  providerName: string;
};
type StoredConversationMessage = any;

type StoredConversation = {
  agents: StoredConversationAgent[];
  messages: StoredConversationMessage[];
};

export const createSessionStorageKey = (id: string) => {
  return `conversation-${id}`;
};

class Locker {
  private _locking: Promise<void> = Promise.resolve();
  private _locks = 0;

  isLocked() {
    return this._locks > 0;
  }

  lock() {
    this._locks += 1;

    let unlockNext: () => void;

    const willLock = new Promise<void>(
      (resolve) =>
        (unlockNext = () => {
          this._locks -= 1;

          resolve();
        })
    );

    const willUnlock = this._locking.then(() => unlockNext);

    this._locking = this._locking.then(() => willLock);

    return willUnlock;
  }
}

class Store {
  private sessionStorageKey: string;
  private locker = new Locker();
  private initialStoredAgents: StoredConversationAgent[] = [];

  constructor(
    private container: Container,
    conversation: ConversationController,
    private enabled: boolean // whether or not to store data
  ) {
    this.sessionStorageKey = createSessionStorageKey(conversation.id);

    conversation.onStarted(async () => {
      if (conversation.messages.length > 0) {
        // if the conversation already contains messages
        // for example when re-opening a minimized widget,
        // we do not want to do anything
        return;
      }
      const { agents: storedAgents } = await this.read();

      const agents: Agent[] = [];

      if (storedAgents) {
        storedAgents.forEach((a) => {
          const providerIndex = conversation.providerIndex(a.providerName);
          const provider =
            providerIndex > -1
              ? conversation.registeredProviders[providerIndex]
              : conversation.createProvider(a.providerName);

          const agent = new Agent(provider, {
            name: a.name,
            avatar: a.avatar,
            id: a.id,
          });
          agents.push(agent);
        });
      }

      const { messages: storedMessages } = await this.read();
      storedMessages.forEach((message) => {
        switch (message.type) {
          case 'agent': {
            const agent = agents.find((a) => a.id === message.sender?.id);
            if (agent) {
              agent.print(message.content.items || message.content, {
                key: message.key,
              });
            }
            return;
          }
          case 'user': {
            conversation.user.print(message.content.items || message.content, {
              key: message.key,
            });
            return;
          }
          case 'system':
          default: {
            conversation.print(message.content.items || message.content);
          }
        }
      });
    });
    conversation.onMessageCreated(async (_, data) => {
      this.write(data.message, 'messages');
    });

    conversation.events.subscribe(
      'conversation:agent-created',
      async (_, data) => {
        const agent = {
          id: data.agent.id,
          name: data.agent.name,
          avatar: data.agent.avatar,
          providerName: data.agent.provider.name,
        };
        await this.write(agent, 'agents');
      }
    );

    conversation.events.subscribe(
      'conversation:agent-updated',
      async (_, data) => {
        const { agents } = await this.read();

        await this.write(
          [
            ...agents.map((a) => {
              if (a.id === data.agent.id) {
                return {
                  ...a,
                  name: data.agent.name,
                  avatar: data.agent.avatar,
                };
              }
              return a;
            }),
          ],
          'agents',
          'update'
        );
      }
    );
  }

  setInitialData(data: { agents: AgentSettings[] }) {
    this.initialStoredAgents = data.agents as StoredConversationAgent[];
  }

  async isRehydrated() {
    const { messages } = await this.read();
    return messages.length > 0;
  }

  getStoredAgent(agentId: string) {
    if (!this.enabled) {
      return;
    }
    return this.initialStoredAgents.find((a) => a.id === agentId);
  }

  async write(
    data: any,
    type: 'messages' | 'agents',
    action: 'add' | 'update' = 'add'
  ) {
    if (!this.enabled) {
      return;
    }

    const unlock = await this.locker.lock();
    return createStorageWriter(
      this.container,
      this.sessionStorageKey,
      StorageCategory.Necessary
    ).then(async (write) => {
      if (action === 'add') {
        const prev = await this.read();

        // ensure that we don't duplicate messages by looking at their unqiue keys
        if (
          type === 'messages' &&
          prev.messages.findIndex((m) => m.key === data.key) > -1
        ) {
          unlock();
          return;
        }

        const newData = {
          ...prev,
        };

        if (type === 'messages') {
          newData.messages = [...newData.messages, data];
        } else if (type === 'agents') {
          newData.agents = [...newData.agents, data];
        }

        return write({
          ...prev,
          ...newData,
        }).then(() => {
          unlock();
        });
      }

      if (action === 'update') {
        if (type === 'agents') {
          const prev = await this.read();

          return write({
            ...prev,
            agents: data,
          }).then(() => {
            unlock();
          });
        }
      }

      return write(data).then(() => {
        unlock();
      });
    });
  }

  async read() {
    return readStorage(this.container, this.sessionStorageKey).then((data) => {
      if (!data) {
        return {
          messages: [],
          agents: [],
        };
      }
      return data as StoredConversation;
    });
  }
}

export default Store;
