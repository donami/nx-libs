import { Container } from '@webprovisions/platform';

export const registerCustomMessageComponent = async (
  _container: Container,
  _type: string,
  componentImport: any
) => {
  await componentImport;
  // return container
  //   .getAsync('componentResolver')
  //   .then(async (o: ComponentResolver) => {
  //     const platform = await ConversationPlatform.getInstance(container);
  //     platform.addSubscription(
  //       o.registerComponent(
  //         type,
  //         lazy(() => component)
  //       )
  //     );
  //   });
};
