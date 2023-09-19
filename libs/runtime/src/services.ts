import { Container } from '@webprovisions/platform';
import { createPlatform } from './component-platform-factory';

export const createStorageService = (_container: Container) => {
  return import('@telia-ace/widget-services').then(({ StorageProvider }) => {
    return new StorageProvider();
  });
};

export const createActionResolver = (container: Container) => {
  return import('@telia-ace/widget-core').then(({ ActionResolver }) => {
    return new ActionResolver(container);
  });
};

export const createComponentResolver = (container: Container) => {
  return import('@telia-ace/widget-core').then(({ ComponentResolver }) => {
    return new ComponentResolver(container);
  });
};

export const createComponentPlatform = (container: Container) => {
  return import('@telia-ace/widget-core').then(() => {
    // ({ ComponentPlatform, createComponentModel }) => {
    return createPlatform(container.get('$widget'));
  });
};
