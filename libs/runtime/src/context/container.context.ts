import { Container } from '@webprovisions/platform';
import { createContext } from '@lit-labs/context';

export const containerContext = createContext<Container | undefined>(
  'container'
);
