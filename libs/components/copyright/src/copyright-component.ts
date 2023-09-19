import { createWebComponent } from '@telia-ace/widget-runtime-flamingo';
import { Container } from '@webprovisions/platform';

export const CopyrightComponent = (container: Container) => {
  return createWebComponent(
    container,
    'copyright',
    import('./copyright'),
    (_component) => {}
  );
};

export default CopyrightComponent;
