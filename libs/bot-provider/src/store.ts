import {
  createStorageWriter,
  readStorage,
  StorageCategory,
} from '@telia-ace/widget-services';
import { Container } from '@webprovisions/platform';
import { GlobalState, LooseObject, ServerEntry } from './types';

type MetaData = {
  agent: {
    name: string;
    avatar?: string;
  };
};

type StorageTypes = 'localState' | 'globalState' | 'entries' | 'meta';

class Store {
  private enabled = true; // set whether or not to store data
  private botProviderGlobalStateKey = 'bot-provider-global-state';
  private botProviderLocalStateKey = 'bot-provider-local-state';
  private botProviderEntriesKey = 'bot-provider-entries';
  private botProviderMetaStateKey = 'bot-provider-conversation-meta';

  constructor(private container: Container) {}

  private getKey(type: StorageTypes) {
    let key;
    switch (type) {
      case 'localState':
        key = this.botProviderLocalStateKey;
        break;
      case 'globalState':
        key = this.botProviderGlobalStateKey;
        break;
      case 'entries':
        key = this.botProviderEntriesKey;
        break;
      case 'meta':
        key = this.botProviderMetaStateKey;
        break;

      default:
        break;
    }
    return key;
  }

  async read(type: 'localState'): Promise<LooseObject | undefined>;
  async read(type: 'meta'): Promise<MetaData | undefined>;
  async read(type: 'entries'): Promise<ServerEntry[] | undefined>;
  async read(type: 'globalState'): Promise<GlobalState | undefined>;
  async read(type: StorageTypes): Promise<any | undefined> {
    const key = this.getKey(type);
    if (!this.enabled || !key) {
      return;
    }

    return readStorage(this.container, key);
  }

  async write(data: any, type: StorageTypes) {
    const key = this.getKey(type);
    if (!this.enabled || !key) {
      return;
    }

    const write = await createStorageWriter(
      this.container,
      key,
      StorageCategory.Necessary
    );
    write(data);
  }
}

export default Store;
