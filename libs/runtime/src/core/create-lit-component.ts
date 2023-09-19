import {
  ComponentResolver,
  extendComponent,
  ExtendComponentHandler,
  ExtendComponentOptions,
} from '@telia-ace/widget-core-flamingo';
import { Container } from '@webprovisions/platform';

/**
 * Registers a Lit  component on the component platform.
 * @param container Container to register the component on.
 * @param type Type name to resolve the component from configuration.
 * @param component Promise resolving to the Lit component for rendering.
 * @param fn Handler for controlling the component.
 */
const createLitComponent = (
  container: Container,
  type: string,
  component: any, // e.g. import('./component.ts)
  fn?: ExtendComponentHandler,
  options?: ExtendComponentOptions
) => {
  return container
    .getAsync('componentResolver')
    .then((componentResolver: ComponentResolver) => {
      componentResolver.registerComponent(type, component);
      return extendComponent(container, type, fn || (() => {}), type, options);
    });
};

export default createLitComponent;
