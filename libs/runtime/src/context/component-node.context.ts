import { createContext } from '@lit-labs/context';
import { ComponentDescriptor } from '@telia-ace/widget-core-flamingo';

export const descriptorContext = createContext<ComponentDescriptor | undefined>(
  'descriptor'
);
