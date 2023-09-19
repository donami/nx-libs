import { createContext } from '@lit-labs/context';

export const propertiesCtx = createContext<Record<string, any>>('properties');
