import { createDataProvider } from '@telia-ace/widget-runtime-flamingo';
import { createWebComponent } from '@telia-ace/widget-runtime-flamingo';
import { Container } from '@webprovisions/platform';

export const ListComponent = (container: Container) => {
  return createWebComponent(
    container,
    'list',
    import('./list'),
    (component) => {
      const fetchItems = async () => {
        component.writeProperties({ loading: true, items: [], totalItems: 0 });
        const provider = await createDataProvider(component, container);
        const data = await provider.getData('items', {});
        component.writeProperties({
          loading: false,
          items: data?.items || [],
          totalItems: data?.totalItems || 0,
        });
      };

      fetchItems();
    }
  );
};

export default ListComponent;
