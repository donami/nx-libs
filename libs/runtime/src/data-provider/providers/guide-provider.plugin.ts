import { Container } from '@webprovisions/platform';
import { DataProvider } from '../data-provider';

type RawGuide = any;

const formatGuideToItem = (rawGuide: Record<string, RawGuide>) => {
  return {
    title: rawGuide.Title,
    id: rawGuide.Id.toString(),
  };
};

class GuideProvider extends DataProvider {
  constructor(container: Container) {
    super(container);

    this.addResource('item', {
      query: async (input: Record<string, any>, providerSettings) => {
        const itemId = input.itemId;
        const client = '78aacc09-ae6f-5485-5ca3-9dacebb95825';
        const funnel = container.get('$widget').name;
        const projection = providerSettings.projection || '';

        const response = await fetch(
          `${projection}/guides/${itemId}?client=${client}&funnel=${funnel}&site=%2F%2Fdemo.humany.cc%2Fadmin%2Finterfaces&phrase=&connectionId=&p.LastGuideId=2857`
        );

        const data = await response.json();

        return data ? formatGuideToItem(data) : null;
      },
    });

    this.addResource('items', {
      query: async (_input, providerSettings) => {
        const client = '';
        const funnel = container.get('$widget').name;
        const projection = providerSettings.projection || '';
        const site = '';
        const skip = '0';
        const take = '10';

        const response = await fetch(
          `${projection}/guides?client=${client}&funnel=${funnel}&site=${site}&phrase=&skip=${skip}&take=${take}&sorting.type=popularity&sorting.direction=descending`
        );

        const data = await response.json();

        return {
          items: (data.Matches || []).map((item: RawGuide) => {
            return formatGuideToItem(item);
          }),
          totalItems: data?.TotalMatches || 0,
        };
      },
    });
  }
}

export const GuideProviderPlugin = async (container: Container) => {
  container.registerAsync('guideProvider', () => {
    return new GuideProvider(container);
  });
};
