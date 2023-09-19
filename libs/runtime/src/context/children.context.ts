import { createContext } from '@lit-labs/context';
import { ComponentDescriptor } from '@telia-ace/widget-core-flamingo';

export const childrenContext = createContext<ComponentDescriptor[]>('children');
