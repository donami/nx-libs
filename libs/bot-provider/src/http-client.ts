import { uuid } from '@telia-ace/widget-utilities';
import { Container, EventManager } from '@webprovisions/platform';
import { processEntries } from './entry-handler';
import Store from './store';
import { ClientEnvelope, MessageGroup, ServerEntry, ServerEnvelope } from './types';

class HttpClient {
    private globalState: any;
    private localState: ServerEntry['localState'];
    private clientId: string;
    private entries: ServerEntry[];

    constructor(
        private endpoint: string,
        private events: EventManager,
        private store: Store,
        private container: Container
    ) {
        this.clientId = uuid();
        this.entries = [];
    }

    async start({ silent }: { silent: boolean }) {
        const storedGlobalState = await this.store.read('globalState');
        const storedLocalState = await this.store.read('localState');
        const storedEntries = await this.store.read('entries');

        // if there is state stored we need to set it
        this.globalState = storedGlobalState || this.globalState;
        this.localState = storedLocalState || this.localState;
        this.entries = storedEntries || this.entries;

        // dont create initial envelope if the client should just
        // set local and global state and then start silently
        if (silent) {
            return;
        }

        const envelope = this.createInitialEnvelope();
        const initialResponse = await this.postEnvelope(envelope);
        return initialResponse;
    }

    async sendMessage(message: string) {
        const envelope = {
            command: { phrase: message },
            globalState: this.globalState,
            clientId: this.clientId,
        };

        const result = await this.postEnvelope(envelope);
        return result;
    }

    async helpAction() {
        return this.postEnvelope({
            action: {
                key: 'help',
                content: {
                    $type: 'Humany.Matching.Bots.Conversations.Actions.Help, Humany.Matching',
                },
            },
            globalState: this.globalState,
            clientId: this.clientId,
        });
    }

    async nextAction(group: MessageGroup) {
        const { paging } = group.meta;
        if (!paging.actions?.next) {
            return;
        }
        return this.postEnvelope(
            {
                action: {
                    key: 'next',
                    content: paging.actions.next,
                },
                localState: paging.localState,
                globalState: this.globalState,
                clientId: this.clientId,
            },
            group
        ).then((response) => {
            const listItemIndex = group.items.findIndex((item) => item.message[0] === 'link-list');
            if (listItemIndex === -1 || !response) {
                return group;
            }

            return {
                ...group,
                meta: {
                    ...group.meta,
                    ...response[0].meta,
                },
                items: [
                    ...group.items.slice(0, listItemIndex),
                    {
                        ...group.items[listItemIndex],
                        message: [
                            response[0].items[0].message[0],
                            {
                                ...group.items[listItemIndex].message[1],
                                ...response[0].items[0].message[1],
                            },
                        ],
                    },
                    ...group.items.slice(listItemIndex + 1),
                ],
            };
        });
    }

    async showContactMethodAction(data: {
        contactMethod: any;
        actionKey: string;
        entryId: string;
    }) {
        const entry = this.entries.find((e) => e.id === data.entryId);
        const actionItem = entry?.actions[data.actionKey];

        if (!actionItem) {
            return;
        }

        return this.postEnvelope({
            action: {
                key: data.actionKey,
                content: actionItem,
            },
            localState: entry.localState,
            globalState: this.globalState,
            clientId: this.clientId,
        });
    }

    async defaultAction(action: string) {
        const entry = this.getEntryOfAction(action);

        if (!entry) {
            return;
        }

        return this.postEnvelope({
            action: {
                key: action,
                content: entry.actions[action],
            },
            localState: entry.localState,
            globalState: this.globalState,
            clientId: this.clientId,
        });
    }

    private createInitialEnvelope(): ClientEnvelope {
        return {
            command: { site: this.endpoint },
            clientId: this.clientId,
            globalState: {},
            funnel: this.container.get('$widget').name,
        };
    }

    private async postEnvelope(envelope: ClientEnvelope, prevGroup?: MessageGroup) {
        try {
            const response = await fetch(this.endpoint, this.getHttpOptions(envelope));

            if (!response.ok) {
                throw response;
            }

            const data = await response.json();

            return this.handleResponse(data, prevGroup);
        } catch (error: any) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Something went wrong when posting the envelope.');
            }
            let message = 'Something went wrong';
            if (
                error.message === 'Failed to fetch' ||
                error.message === 'NetworkError when attempting to fetch resource.'
            ) {
                message = 'Lost connection... Please try again.';
            }
            return this.handleResponse({
                entries: [
                    {
                        id: uuid(),
                        type: 'Error',
                        timestamp: new Date().toISOString(),
                        content: {
                            message,
                        },
                        actions: {},
                        tags: [],
                    },
                ],
            });
        }
    }

    private async handleResponse(data: ServerEnvelope, prevGroup?: MessageGroup) {
        this.entries = this.entries.concat(data.entries);
        this.store.write(this.entries, 'entries');

        const widgetEntry = data.entries.find((e) => e.type === 'Widget');

        if (widgetEntry) {
            this.events.dispatch('provider:widget-entry', widgetEntry.content);
        }

        if (data.globalState) {
            this.globalState = data.globalState;
            this.store.write(data.globalState, 'globalState');
        }

        this.localState = data.entries.reduce<ServerEntry['localState']>((acc, entry) => {
            if (entry.localState) {
                return entry.localState;
            }
            return acc;
        }, undefined);
        this.store.write(this.localState, 'localState');

        const groups = await processEntries(this.container, data.entries, prevGroup);
        return groups;
    }

    private getHttpOptions(envelope: ClientEnvelope) {
        const fetchOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        };
        envelope.funnel = this.container.get('$widget').name;
        envelope.localState = envelope.localState || this.localState;
        return Object.assign({}, fetchOptions, {
            body: JSON.stringify(envelope),
            credentials: 'same-origin' as RequestCredentials,
        });
    }

    private getEntryOfAction(action: string) {
        return this.entries.find((entry) => !!entry.actions[action]);
    }
}

export default HttpClient;
