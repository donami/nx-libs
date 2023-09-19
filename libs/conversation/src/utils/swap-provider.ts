import { ComponentPlatform } from '@telia-ace/widget-core';
import { Container } from '@webprovisions/platform';
import { ConversationPlatform } from '../conversation-platform';

/**
 * This will put the current provider(s) in a queue and
 * swap current provider to another one based on the providerName.
 * When ConversationProvider.complete() is called, the provider(s) in the
 * queue will become active again
 */
export const swapProvider = async (
  container: Container,
  conversationId: string,
  providerName: string
) => {
  const conversation: ConversationPlatform = await container.getAsync(
    'conversation'
  );
  const components: ComponentPlatform = await container.getAsync('components');
  const currentInstance = conversation.controllers.find((c) => {
    return c.conversation.id === conversationId;
  });

  if (currentInstance) {
    const toQueue = [...currentInstance.conversation.providers];
    toQueue.forEach((name) => {
      currentInstance.conversation.setProviderOptions(name, { silent: true });
    });
    currentInstance.conversation.queueProviders(toQueue);
    currentInstance.conversation.setProviders([providerName]);
    const conversationQuery = components.components().ofType('conversation');
    components.write({
      key: 'setConversationProvider',
      attributes: {
        properties: { providers: [providerName] },
      },
      target: conversationQuery,
      provider: 'localStorage',
    });
  }
};
