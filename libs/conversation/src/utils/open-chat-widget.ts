import { ComponentPlatform, WidgetSettings } from '@telia-ace/widget-core';
// import { closeAllModals } from '@telia-ace/widget-plugins';
import {
  createStorageWriter,
  StorageCategory,
  StorageMedium,
  StorageScope,
} from '@telia-ace/widget-services';
import { Container, Implementation, Widget } from '@webprovisions/platform';
import {
  ConversationEndedBehavior,
  ConversationPlatform,
} from '../conversation-platform';

const getParentWidget = (
  widgetName: string,
  implementation: Implementation
) => {
  const mainWidgetName = widgetName.split('_contact');
  return implementation.widgets.get(mainWidgetName[0]);
};

const getSeparateWidget = (container: Container) => {
  const originWidget = container.get('$widget');
  const { name, implementation }: Widget = container.get('$widget');

  const mainWidget =
    name.indexOf('_contact') > -1
      ? getParentWidget(name, implementation)
      : originWidget;
  const { data }: WidgetSettings = container.get('$settings');
  const { trigger }: WidgetSettings = mainWidget.container.get('$settings');
  const chatWidgetName = `${name
    .replace('_contact-method', '')
    .replace('_contact', '')}_contact-method`;

  const chatWidget = implementation.widgets.get(chatWidgetName);
  if (chatWidget && !trigger) {
    return { chatWidget, mainWidget, data };
  }
  return { mainWidget, data };
};

export const shouldPreventDefault = (container: Container) => {
  const { chatWidget } = getSeparateWidget(container);
  return !!chatWidget;
};

export const openChatWidget = (
  container: Container,
  contactMethod: any /*ContactMethodType*/,
  triggerDOMTarget?: HTMLElement
) => {
  const {
    mainWidget: _mainWidget,
    data,
    chatWidget,
  } = getSeparateWidget(container);

  if (chatWidget) {
    if (chatWidget.state === 'activated') {
      return chatWidget.invoke('open').then(() => {
        chatWidget.container.getAsync('conversation').then((conversation) => {
          conversation.navigateToConversationIfActive(contactMethod.id);
          // .then(() => closeAllModals(container)); // TODO:
        });
      });
    }
    return chatWidget
      .activate()
      .then(() => {
        const { trigger } = chatWidget.container.get('$settings');
        trigger.action = 'hide'; // could be default in configuration
        return chatWidget
          .invoke('setSettings', () => ({
            data,
            trigger,
            activate: true,
          }))
          .then(() => {
            return chatWidget.container
              .getAsync('components')
              .then((components: ComponentPlatform) => {
                /**
                 * Could cause issues if target widget is no longer as specific for this use case
                 */
                const contactMethodsQuery = components
                  .components()
                  .ofType('contact-method');
                components.write({
                  key: 'setContactMethodId',
                  attributes: {
                    properties: {
                      id: contactMethod.id,
                      guideId: contactMethod.guideId,
                    },
                  },
                  target: contactMethodsQuery,
                  provider: 'localStorage',
                });
                const conversationsQuery = components
                  .components()
                  .ofType('conversation');
                components.write({
                  key: 'setConversationProvider',
                  attributes: {
                    properties: { providers: [contactMethod.clientName] },
                  },
                  target: conversationsQuery,
                  provider: 'localStorage',
                });
              });
          });
      })
      .then(() => {
        return chatWidget.invoke('attach', {
          key: 'contact-method',
          triggerDOMElement: triggerDOMTarget,
          withRenderState: 'open',
        });
      })
      .then(() => {
        createStorageWriter(
          chatWidget.container,
          'activeStickyWidget',
          StorageCategory.Necessary,
          {
            medium: StorageMedium.Local,
            scope: StorageScope.Implementation,
          }
        ).then((write) => write(chatWidget.name));

        return (
          chatWidget.container
            .getAsync('conversation')
            .then((platform) => {
              platform.setConversationEndedBehavior(
                ConversationEndedBehavior.Deactivate
              );
            })
            // .then(() => closeAllModals(container)) // TODO:
            .then(() => false)
        );
      });
  }
  // mainWidget.container
  //   .getAsync('conversation')
  //   .then((platform: ConversationPlatform) => {
  //     return platform
  //       .navigateToConversationIfActive(contactMethod.id)
  //       .then(() =>
  //         platform.setConversationEndedBehavior(
  //           ConversationEndedBehavior.Navigate
  //         )
  //       );
  //   });
  return chatWidget ? false : true;
};

export const navigateToConversation = (
  container: Container,
  contactMethod: any /*ContactMethodType*/,
  _routeName = 'conversation'
) => {
  const { mainWidget, chatWidget: _chatWidget } = getSeparateWidget(container);
  // if (chatWidget) {
  //   return chatWidget.container.getAsync('router').then((router: any) => {
  //     router.navigate(routeName, { id: contactMethod.id });
  //   });
  // }

  return mainWidget.container
    .getAsync('conversation')
    .then((platform: ConversationPlatform) => {
      platform
        .setConversationEndedBehavior(ConversationEndedBehavior.Navigate)
        ?.then(() => {
          // mainWidget.container.getAsync('router').then((router: any) => {
          mainWidget.container
            .getAsync('components')
            .then((components: ComponentPlatform) => {
              const conversationQuery = components
                .components()
                .ofType('conversation');
              components.write({
                key: 'setConversationProvider',
                attributes: {
                  properties: { providers: [contactMethod.clientName] },
                },
                target: conversationQuery,
                provider: 'localStorage',
              });
            });
          // .then(() => {
          //   router.navigate(routeName, { id: contactMethod.id });
          // });
          // });
        });
    });
};
