import { createContext } from '@lit-labs/context';
import { ComponentDescriptor } from '@telia-ace/widget-core';

export const descriptorContext = createContext<ComponentDescriptor | undefined>(
  'descriptor'
);
