import { ActionResolver, WidgetRenderState } from '@telia-ace/widget-core';
import { Container } from '@webprovisions/platform';

export const getRenderState = async (container: Container) => {
  const widget = container.get('$widget');

  const renderState: WidgetRenderState = await widget.invoke('renderState');

  return renderState;
};

export const subscribeToRenderState = async (
  container: Container,
  subscriptionFn: (origin: string, action: string) => void
) => {
  const widget = container.get('$widget');

  const actionResolver: ActionResolver = await container.getAsync(
    'actionResolver'
  );

  const unsubscribe = actionResolver.subscribe(widget.name, subscriptionFn);

  return unsubscribe;
};
