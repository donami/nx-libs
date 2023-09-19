import { Container } from '@webprovisions/platform';
import { WrapperComponent } from './wrapper';
import './area';

export default (container: Container, element: HTMLElement) => {
  // element.addEventListener('request', (event: any) => {
  //   if (event.detail.type === 'container') {
  //     event.detail.instance = container;
  //   }
  // });

  // TODO: figure out why this tick is needed
  setTimeout(() => {
    const root = new WrapperComponent();
    root.container = container.parent; // TODO: change back to just container?

    element.appendChild(root);
  }, 0);
};
