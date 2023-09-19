/* eslint-disable @typescript-eslint/no-empty-function */
import { Container } from '@webprovisions/platform';

import {
  ConversationMessageContent,
  ConversationMessageSender,
} from '../../types';
import {
  ConversationMessage,
  ConversationMessageType,
} from '../../conversation-controller';
import { ConversationPlatform } from '../../conversation-platform';
import { createWebComponent } from '@telia-ace/widget-runtime-flamingo';

export type BundledConversationMessage = {
  timestamp: number;
  content: [BundledMessageContent];
  sender: ConversationMessageSender;
  type: ConversationMessageType;
};

type BundledMessageContent = {
  key: string;
} & ConversationMessageContent;

export type ConversationContent = {
  loading: boolean;
  typingActors: ConversationMessageSender[];
  messages: ConversationMessage[];
};

/**
 * Group items by sender, type and time. Current grouping threshold is 2000 ms.
 * Put this as a property on either the component or on the provider?
 * Could possibly be implemented directly in the createEntry method
 * of the conversation controller to avoid iterating over the entire array on
 * each update.
 */
const groupedMessages = (
  messages: ConversationMessage[],
  timeout?: number
): BundledConversationMessage[] => {
  return messages.reduce((acc: any[], current: any, _index: number) => {
    const newItem = {
      ...current,
      content: [{ ...current.content, key: current.key }],
    };
    if (acc.length > 0 && current.type !== ConversationMessageType.System) {
      const previous = acc[acc.length - 1];
      if (
        (!timeout && timeout !== 0) ||
        Math.abs(previous.timestamp - current.timestamp) < timeout
      ) {
        if (
          previous.sender?.name === current.sender?.name &&
          previous.type === current.type
        ) {
          previous.timestamp = current.timestamp;
          previous.content.push({ ...current.content, key: current.key });
          return acc;
        }
      }
    }
    acc.push(newItem);
    return acc;
  }, []);
};

export type ConversationComponentProperties = {
  providers: string[];
  messages: BundledConversationMessage[]; // internal
  overlay?: { conversation: boolean; secondary: boolean }; // internal
  overlayConversationHeader?: string;
  overlayConversationCloseLabel?: string;
  loading: boolean;
  inputPlaceholder: string;
  inputDisabled: boolean;
  inputHidden: boolean;
  inputMultiline: boolean;
  rehydrate?: boolean;
  userLabel: string;
  avatarSize: string;
  typingActors: any[]; // internal
  conversationControllerId?: string; // internal
  sendButtonLabel: string;
  secondaryAction?: { icon?: string; action: string; label: string };
};

export const ConversationComponent = async (container: Container) => {
  return createWebComponent(
    container,
    'conversation',
    import('./conversation'),
    async (component) => {
      // const router = await container.getAsync('router');
      const platform = await ConversationPlatform.getInstance(container);

      const { rehydrate = false } =
        component.properties<ConversationComponentProperties>();
      // const routeData = router.getRouteData();
      // const name = routeData.params.id || component.node.name || 'component';
      const name = 'component';

      const conversation = await platform.createController(name, { rehydrate });
      const isNewController = platform.registerController(
        conversation,
        component
      );

      const messageGroupingTimeout = 3 * 60 * 1000;

      const setProperties = (properties: ConversationComponentProperties) => {
        const { providers = [] } = properties;
        if (providers) {
          const providerKeys = Array.isArray(providers)
            ? providers
            : [providers];
          conversation.setProviders(providerKeys);
          return providerKeys;
        }
      };
      setProperties(
        component.properties<ConversationComponentProperties>(setProperties)
      );

      conversation.setComponentMountedState(true);

      const writeMessages = (messageStream: any) => {
        const { loading, typingActors, messages } = messageStream;
        component.writeProperties({
          loading,
          typingActors,
          messages: groupedMessages(messages, messageGroupingTimeout),
        });
      };

      writeMessages(conversation.getMessageStream());

      if (isNewController) {
        component.writeProperties({
          conversationControllerId: conversation.id,
        });
        // todo: dont create actions here, there will be duplicates due to reuseController = true
        component.actions.create('user-submit', (data, options) => {
          if (options) {
            const { preventDefault, validationPromise } = options;
            if (preventDefault) {
              if (validationPromise) {
                validationPromise().then((text: string) => {
                  if (text) {
                    conversation.user.print(text);
                  }
                });
              }
              return;
            }
          }
          conversation.user.print(data.text);
        });

        component.actions.create('user-typing', (_data, _options) => {});

        component.actions.create('form', (_data, _options) => {});

        component.actions.create('action', (_data, _options) => {});

        component.actions.create('overlay-mounted', (_data, _options) => {});

        component.actions.create('show-overlay', (_data, _options) => {
          component.writeProperties({
            overlay: { conversation: false, secondary: false },
          });
        });

        component.actions.create('hide-overlay', (_data, _options) => {
          component.writeProperties({
            overlay: null,
          });
        });

        component.actions.create(
          'show-overlay-conversation',
          (_data, _options) => {
            component.writeProperties({
              overlay: { conversation: true, secondary: false },
            });
          }
        );

        component.actions.create(
          'hide-overlay-conversation',
          (_data, _options) => {
            component.writeProperties({
              overlay: { conversation: false, secondary: false },
            });
          }
        );
      }

      const unsubscribe = conversation.events.subscribe(
        'conversation:updated',
        (_e: any, conversationData: ConversationContent) => {
          writeMessages(conversationData);
        }
      );

      return () => {
        conversation.setComponentMountedState(false);
        unsubscribe();
        if (!conversation.active) {
          // unregisterController();
          // todo: add possibility to dispose this through extendComponent()
          // component.dispose();
          writeMessages({ messages: [], typingActors: [], loading: false });
        }
      };
    },
    {
      reuseController: true,
    }
  );
};

export default ConversationComponent;
