// import { WidgetSettings } from '@telia-ace/knowledge-widget-core';
import { Container, Widget } from '@webprovisions/platform';

export const createServiceClient = (container: Container) => {
  return import('@telia-ace/knowledge-serviceclient').then(
    ({ ServiceClient, ServiceProxy }) => {
      return container.get('settings').then((settings: any) => {
        const { name, events }: Widget = container.get('$widget');
        const {
          data: { projection = '', site = 'current', forceHttps = false },
        } = settings;

        const proxy = new ServiceProxy(projection, {
          credentials: 'same-origin',
        });

        // Replacing '_contact' & '_contact-method' while
        // still using the shadow widget concept
        const client = new ServiceClient(
          proxy,
          {
            funnel: name.replace('_contact-method', '').replace('_contact', ''),
            site: createSiteProvider(site, forceHttps),
          },
          null,
          container
        );

        events.subscribe('widget:settings-updated', (_event, { data }: any) => {
          if (data && data.projection !== projection) {
            client.proxy.setBaseUrl(data.projection);
          }
        });

        return client;
      });
    }
  );
};

type SiteLocation = {
  host: string;
  pathname: string;
};

const createSiteProvider = (
  site: 'current' | 'referrer',
  forceHttps: boolean
): (() => string) => {
  return () => {
    const parseLocation = (href: string): SiteLocation => {
      const link = document.createElement('a');
      link.href = href;
      return link;
    };

    let location: SiteLocation = window.location;
    if (site === 'referrer' && document.referrer) {
      location = parseLocation(document.referrer);
    }
    return [
      forceHttps ? 'https:' : '',
      '//',
      location.host,
      location.pathname,
    ].join('');
  };
};
