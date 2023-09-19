import {
  ChangesetOptions,
  ChangesetProvider,
  ComponentNodeAttributes,
  ComponentNodeSettings,
  ComponentPlatform,
  ComponentQuery,
  ComponentQueryRule,
  createComponentModel,
  WidgetSettings,
} from '@telia-ace/widget-core-flamingo';
import {
  createStorageWriter,
  readStorage,
  StorageCategory,
  StorageMedium,
  StorageWriter,
} from '@telia-ace/widget-services';
import { lock } from '@telia-ace/widget-utilities';
import { Container, Widget, WidgetState } from '@webprovisions/platform';

const STORAGE_KEY = 'changesets';

type ChangesetItem = {
  rules: ComponentQueryRule[];
  attributes: Partial<ComponentNodeAttributes>;
  options: ChangesetOptions;
};

type ChangesetItemBag = {
  items?: { [key: string]: ChangesetItem };
  keys?: string[];
};

const convertSettingsToAttributes = (
  settings: Partial<ComponentNodeSettings>
): Partial<ComponentNodeAttributes> => {
  const attributes: Partial<ComponentNodeAttributes> = { tags: settings.tags };
  if (settings.context && typeof settings.context !== 'function') {
    attributes.context = settings.context;
  }
  if (settings.properties && typeof settings.properties !== 'function') {
    attributes.properties = settings.properties;
  }
  if (settings.layout && typeof settings.layout !== 'function') {
    attributes.layout = settings.layout;
  }

  return attributes;
};

export class LocalStorageChangesetProvider implements ChangesetProvider {
  constructor(
    private container: Container,
    private storageWriter: StorageWriter
  ) {}

  static create(container: Container): Promise<LocalStorageChangesetProvider> {
    return createStorageWriter(
      container,
      STORAGE_KEY,
      StorageCategory.Necessary,
      {
        medium: StorageMedium.Local,
      }
    ).then(
      (storageWriter) =>
        new LocalStorageChangesetProvider(container, storageWriter)
    );
  }

  write(
    key: string,
    target: ComponentQuery,
    attributes: Partial<ComponentNodeSettings>,
    options: ChangesetOptions
  ): Promise<any> {
    return lock(this)(() => {
      return readStorage<ChangesetItemBag>(
        this.container,
        STORAGE_KEY,
        StorageMedium.Local
      ).then((bag = {}) => {
        const { keys = [], items = {} } = bag;
        const existingIndex = keys.indexOf(key);
        if (existingIndex > -1) {
          keys.splice(existingIndex, 1);
        }
        keys.push(key);
        items[key] = {
          options,
          attributes: convertSettingsToAttributes(attributes),
          rules: target.rules,
        };
        return this.storageWriter({ keys, items });
      });
    });
  }

  remove(key: string): Promise<any> {
    return lock(this)(() => {
      return readStorage<ChangesetItemBag>(
        this.container,
        STORAGE_KEY,
        StorageMedium.Local
      ).then((bag = {}) => {
        const { keys = [], items = {} } = bag;
        const indexToRemove = keys.indexOf(key);
        if (indexToRemove > -1) {
          keys.splice(indexToRemove, 1);
          delete items[key];
          return this.storageWriter(bag);
        }
      });
    });
  }

  load(platform: ComponentPlatform): Promise<any> {
    return lock(this)(() => {
      return readStorage<ChangesetItemBag>(
        this.container,
        STORAGE_KEY,
        StorageMedium.Local
      ).then((bag = {}) => {
        const { keys = [], items = {} } = bag;
        keys.forEach((key) => {
          const item = items[key];
          if (item) {
            const { rules, attributes, options } = item;
            platform.write({
              attributes,
              options,
              target: new ComponentQuery(platform, rules),
            });
          }
        });
      });
    });
  }
}

export const createPlatform = (widget: Widget): Promise<ComponentPlatform> => {
  const { container } = widget;
  return LocalStorageChangesetProvider.create(container).then(
    (localStorage) => {
      const settings: WidgetSettings = container.get('$settings');
      const providers = { localStorage };
      const platform = new ComponentPlatform(widget, providers);
      const destructComponentModel = createComponentModel(platform, settings);

      widget.events.subscribe(
        'widget:state-change',
        (_event, data: { state: WidgetState }) => {
          if (data.state === WidgetState.Deactivating) {
            destructComponentModel();
          }
        }
      );

      return platform;
    }
  );
};
