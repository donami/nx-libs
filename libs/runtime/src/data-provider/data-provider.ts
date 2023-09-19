import { ComponentNodeController } from '@telia-ace/widget-core';
import { Container } from '@webprovisions/platform';

type DataResource = {
  query: (
    input: Record<string, any>,
    providerSettings: Record<string, any>
  ) => Promise<any>;
};

type DataProviderSettings = Record<string, any>;

export const getProvider = async (
  component: ComponentNodeController,
  container: Container
) => {
  const providerProperty: string | [string, any] | undefined =
    component.properties().provider;
  let providerSettings = {};

  let providerKey = '';
  if (Array.isArray(providerProperty)) {
    providerKey = providerProperty[0];
    providerSettings = providerProperty[1];
  } else {
    providerKey = providerProperty || '';
  }

  const provider: DataProvider | undefined = await container.getAsync(
    providerKey
  );

  if (!provider) {
    throw new Error('No provider defined in ListComponent');
  }

  provider.applyComponentNodeSettings(component.node.id, providerSettings);

  return { provider, settings: providerSettings };
};

export const createDataProvider = async (
  component: ComponentNodeController,
  container: Container
) => {
  const { provider, settings = {} } = await getProvider(component, container);

  return {
    addResource: (resourceKey: string, resource: DataResource) => {
      return provider.addResource(resourceKey, resource);
    },
    getData: (resourceKey: string, input: Record<string, any>) => {
      return provider.getData(resourceKey, input, settings);
    },
  };
};

export class DataProvider {
  private resources = new Map<string, DataResource>();
  private nodeConfiguration = new Map<string, DataProviderSettings>();

  constructor(public container: Container) {}

  async getData(
    resourceKey: string,
    input: Record<string, any>,
    providerSettings: Record<string, any>
  ) {
    const entityProvider = this.resources.get(resourceKey);

    if (!entityProvider) {
      throw new Error(`Unable to get EntityProvider for "${resourceKey}"`);
    }

    const response = await entityProvider.query(input, providerSettings);

    return response;
  }

  addResource(resourceKey: string, resource: DataResource) {
    this.resources.set(resourceKey, resource);
  }

  applyComponentNodeSettings(nodeId: string, value: DataProviderSettings) {
    this.nodeConfiguration.set(nodeId, value);
  }
}
