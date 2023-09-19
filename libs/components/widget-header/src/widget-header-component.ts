import { createWebComponent } from '@telia-ace/widget-runtime-flamingo';
import { Container } from '@webprovisions/platform';

export const WidgetHeaderComponent = (container: Container) => {
  return createWebComponent(
    container,
    'widget-header',
    import('./widget-header'),
    (_component) => {}
  );
};

export default WidgetHeaderComponent;
