import { Container, Widget } from '@webprovisions/platform';
import KnowledgeBotProvider from './provider';
import { CustomMessageTypes } from './types';
import {
  ConversationPlatform,
  registerCustomMessageComponent,
} from '@telia-ace/widget-conversation-flamingo';
// import { CustomMessageTypes } from './types';

const KnowledgeBotProviderPlugin = async (container: Container) => {
  setTimeout(async () => {
    const platform = await ConversationPlatform.getInstance(container);

    registerCustomMessageComponent(
      container,
      CustomMessageTypes.NoGoodAlternative,
      import('./ui/no-good-alternative')
    );

    registerCustomMessageComponent(
      container,
      CustomMessageTypes.FeedbackList,
      import('./ui/feedback-list')
    );

    // registerCustomMessageComponent(
    //     container,
    //     CustomMessageTypes.ContactList,
    //     import('./ui/contact-method-list')
    // );
    // registerCustomMessageComponent(
    //     container,
    //     CustomMessageTypes.ContactMethod,
    //     import('./ui/contact-method')
    // );

    // registerCustomMessageComponent(
    //     container,
    //     CustomMessageTypes.NotificationList,
    //     import('./ui/notification-list')
    // );
    // registerCustomMessageComponent(
    //     container,
    //     CustomMessageTypes.NoGoodAlternative,
    //     import('./ui/no-good-alternative')
    // );
    // registerCustomMessageComponent(
    //     container,
    //     CustomMessageTypes.FeedbackList,
    //     import('./ui/feedback-list')
    // );

    platform.registerProvider(
      'ace-knowledge-bot',
      (conversation, component) => {
        const provider = new KnowledgeBotProvider(
          container,
          conversation,
          component
        );
        provider.initialize();

        const subscriptions: any[] = [];
        subscriptions.push(
          component.actions.watch(
            'conversation.user-submit',
            (input, _next) => {
              provider.onMessageSend(input.text);
            }
          )
        );

        subscriptions.push(
          component.actions.watch('conversation.action', (input, next) => {
            provider.onInput(input);

            return next(input);
          })
        );

        subscriptions.push(
          component.actions.create('evaluate', (input) => {
            const { events } = container.get('$widget') as Widget;
            events.dispatch('bot-provider:evaluate', input);
          })
        );

        subscriptions.push(
          component.actions.create('submit', (input) => {
            const { events } = container.get('$widget') as Widget;
            events.dispatch('bot-provider:form-submitted', input);
          })
        );

        return () => {
          // cleaning up when provider is disposed
          subscriptions.forEach((unsubscribe) => {
            unsubscribe();
          });
        };
      }
    );
  }, 0);
};

export default KnowledgeBotProviderPlugin;
