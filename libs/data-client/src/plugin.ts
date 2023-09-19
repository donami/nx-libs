import { Container } from '@webprovisions/platform';
import DataClient from './data-client';

export const KnowledgeDataClientPlugin = async (container: Container) => {
  container.registerAsync('dataClient', () => {
    return DataClient.create(container);
  });
};
