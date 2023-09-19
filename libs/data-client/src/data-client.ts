import { ServiceClient } from '@telia-ace/knowledge-serviceclient';
import { WidgetRenderState } from '@telia-ace/widget-core';
import {
  deepClone,
  lock,
  removeNullAndUndefinedValues,
  shallowCompare,
} from '@telia-ace/widget-utilities';
import { Container, EventManager, Widget } from '@webprovisions/platform';
import { createServiceClient } from './create-serviceclient';
import { formatLegacyData } from './legacy-conversion';

export type Subscriber = (...args: any[]) => void;

export enum DataType {
  Guide = 'guide',
  Guides = 'guides',
  GuidesByCategory = 'guides-by-category',
  RowNotifications = 'row-notices',
  NotificationLists = 'notification-lists',
  GuideCategories = 'guide-categories',
  ContactMethodCategories = 'contact-method-categories',
  ContactMethod = 'contact-method',
  ContactMethods = 'contact-methods',
  Tags = 'tags',
  TagsOnGuides = 'tagsonguides',
}

export type DataError = {
  status: number;
  message: string;
};

export enum ServiceClientQueryType {
  Match = 'match',
  Categories = 'categories',
  Guide = 'guide',
  Contacts = 'contacts',
  ContactMethod = 'contact-method',
  MatchByCategory = 'match-by-category',
  Tags = 'tags',
  TagsOnGuides = 'tagsonguides',
  Notifications = 'notifications',
}

export enum FeedbackType {
  Positive = 'Positive',
  Negative = 'Negative',
}

export type QueryParameters = {
  guideId?: string | number;
  categories?: string | number | string[] | number[];
  tagId?: string | number;
  connection?: string;

  contactMethodCategoryId?: string | number;
  contactMethodId?: string | number;

  searchPhrase?: string | number;
  take?: string | number;
  [key: string]: any;

  expandCategories?: 'none' | 'children' | 'descendants';
  sorting?: SortingType;
  guideIds?: string[];
};

export enum SortingType {
  POPULARITY_DESCENDING = 'popularity-descending',
  ALPHABETIC_ASCENDING = 'alphabetic-ascending',
  ALPHABETIC_DESCENDING = 'alphabetic-descending',
  MODIFIED_ASCENDING = 'modified-ascending',
  MODIFIED_DESCENDING = 'modified-descending',
  PUBLISHED_ASCENDING = 'published-ascending',
  PUBLISHED_DESCENDING = 'published-descending',
}

export type Query = {
  params: QueryParameters;
  resolved: boolean;
  loading: boolean;
  error?: DataError;
  data: any;
  resolvers: {
    resolve: (data: any) => void;
    reject: (data: any) => void;
  }[];
};

export const determineServiceClientQueryType = (
  type: DataType
): ServiceClientQueryType => {
  switch (type) {
    case DataType.Guides:
      return ServiceClientQueryType.Match;
    case DataType.GuidesByCategory:
      return ServiceClientQueryType.MatchByCategory;
    case DataType.Guide:
      return ServiceClientQueryType.Guide;
    case DataType.GuideCategories:
      return ServiceClientQueryType.Categories;
    case DataType.ContactMethodCategories:
    case DataType.ContactMethods:
      return ServiceClientQueryType.Contacts;
    case DataType.ContactMethod:
      return ServiceClientQueryType.ContactMethod;
    case DataType.Tags:
      return ServiceClientQueryType.Tags;
    case DataType.TagsOnGuides:
      return ServiceClientQueryType.TagsOnGuides;
    case DataType.NotificationLists:
    case DataType.RowNotifications:
      return ServiceClientQueryType.Notifications;
    default:
      throw 'error';
  }
};

const widgetIsHidden = async (container: Container) => {
  const { invoke } = container.get('$widget');
  const renderState = await invoke('renderState');
  return renderState === WidgetRenderState.hidden;
};

export default class DataClient {
  private queries: Map<ServiceClientQueryType, Query[]> = new Map();
  // private lastTake: number = 0;
  public events: EventManager;
  constructor(
    private container: Container,
    private matchingClient: ServiceClient
  ) {
    this.events = (<Widget>container.get('$widget')).events;

    this.events.subscribe(
      'widget:settings-updated',
      () => (this.queries = new Map())
    );

    this.events.subscribe(
      'widget:render-state-changed',
      (_event, { next, previous }) => {
        if (
          previous === WidgetRenderState.hidden &&
          next === WidgetRenderState.open
        ) {
          this.fetchAllUnresolvedQueries();
        }
      }
    );
  }

  static getInstance(
    container: Container,
    key = 'dataClient'
  ): Promise<DataClient> {
    return lock(this)(() => {
      return container.getAsync(key).then(async (value: DataClient) => {
        let serviceClient = await container.getAsync('matchingClient');

        if (!serviceClient) {
          serviceClient = await createServiceClient(container);
          container.registerAsync('matchingClient', () => serviceClient);
        }

        let platform = value;
        if (!platform) {
          platform = new DataClient(container, serviceClient);
          container.registerAsync(key, () => platform);
        }
        return platform;
      });
    });
  }

  private getUnresolvedQueries = () => {
    let unresolvedCount = 0;
    this.queries.forEach((queries, _type) => {
      const hasUnresolved = queries.some((query: Query) => !query.resolved);
      if (hasUnresolved) {
        unresolvedCount = +1;
      }
    });
    return unresolvedCount;
  };

  public fetch(
    type: DataType,
    params: QueryParameters,
    options?: {
      // this is useful when something else in the environment may have changed that
      // could have side effects, will ensure that a fresh fetch is always initiated
      noCache: boolean;
    }
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (params.take) {
        // this.lastTake = +(params.take || 0);
      }

      removeNullAndUndefinedValues(params);
      const serviceClientQueryType = determineServiceClientQueryType(type);
      let queries = this.queries.get(serviceClientQueryType) || [];

      let query: Query | null =
        queries.find((q) => shallowCompare(q.params, params)) || null;

      if (query && options?.noCache) {
        const index = queries.findIndex((q) =>
          shallowCompare(q.params, params)
        );
        queries = [...queries.slice(0, index), ...queries.slice(index + 1)];
        query = null;
      }

      if (query) {
        const index = queries.indexOf(query);
        if (query.resolved) {
          this.events.dispatch('data-client:fetched', {
            params,
            type: serviceClientQueryType,
            response: query.data,
            unresolvedQueries: this.getUnresolvedQueries(),
          });
          this.track(query.data, serviceClientQueryType, query.error);
          if (query.data && query.error) {
            reject({ error: query.error });
          } else {
            resolve(query.data);
          }
        } else {
          query.resolvers.push({ resolve, reject });
        }
        queries.splice(index, 1);
        queries.push(query);
        this.queries.set(serviceClientQueryType, queries);
        if (!query.loading && !query.resolved) {
          return this.runQuery(serviceClientQueryType, params);
        }
      } else {
        queries.push({
          params,
          resolved: false,
          loading: true,
          data: {},
          resolvers: [{ resolve, reject }],
        });
        this.queries.set(serviceClientQueryType, queries);

        return this.runQuery(serviceClientQueryType, params);
      }
    }).then((res) => deepClone(res));
  }

  // query the cached data
  public read(
    type: DataType,
    options: {
      select?: (data: any) => any; // either return all data by the DataType, or use an selector
    }
  ) {
    const { select } = options;
    const serviceClientQueryType = determineServiceClientQueryType(type);
    const queries = this.queries.get(serviceClientQueryType) || [];

    const result = queries.reduce<any[]>((acc, query) => {
      if (typeof select === 'function') {
        const match = select(query.data);
        if (match) {
          acc.push(match);
        }
      } else {
        acc.push(query.data);
      }
      return acc;
    }, []);
    return result;
  }

  public feedback(
    id: string,
    connection: string,
    feedback: FeedbackType
  ): Promise<any> {
    return this.matchingClient.giveFeedback(id, connection, feedback);
  }

  private setLoadingStatus(
    type: ServiceClientQueryType,
    params: QueryParameters,
    loading: boolean
  ) {
    const queries = this.queries.get(type) || [];
    const query = queries.find((q) => shallowCompare(q.params, params));

    if (query) {
      query.loading = loading;
    }
    this.queries.set(type, queries);
  }

  private async runQuery(
    type: ServiceClientQueryType,
    params: QueryParameters
  ) {
    const {
      searchPhrase = '',
      categories = '0',
      contactMethodCategoryId = '0',
      contactMethodId = '0',
      tagId = undefined,
      take = 5,
      connection = '',
      guideId,
      expandCategories = 'descendants',
      currentCategory,
      sorting = SortingType.POPULARITY_DESCENDING,
      guideIds = [],
    } = params;

    const trimmedPhrase = searchPhrase.toString().trim();
    if (await widgetIsHidden(this.container)) {
      return Promise.resolve();
    }

    switch (type) {
      case ServiceClientQueryType.Match: {
        const formatSortingValues = (sorting: string) => {
          const [type, direction] = sorting.split('-');
          const sortKeysMap = new Map([
            ['popularity', 'popularity'],
            ['alphabetic', 'title'],
            ['modified', 'lastModified'],
            ['published', 'firstPublished'],
          ]);

          return {
            type: sortKeysMap.get(type),
            direction: direction,
          };
        };

        if (guideIds.length) {
          return this.matchingClient
            .customRequest('guides', 'POST', {
              configuration: { ids: guideIds, take: +take },
            })
            .then(
              (matches) => matches && this.handleResponse(matches, type, params)
            );
        }

        return this.matchingClient
          .match(trimmedPhrase, {
            categories:
              categories === '0'
                ? []
                : Array.isArray(categories)
                ? categories
                : [+categories],
            take: +take,
            tags: tagId,
            sorting: formatSortingValues(sorting),
            ids: guideIds,
          })
          .then(
            (matches) => matches && this.handleResponse(matches, type, params)
          );
      }
      case ServiceClientQueryType.MatchByCategory: {
        return this.matchingClient
          .match(trimmedPhrase, {
            groupByCategory: true,
            categories:
              categories === '0'
                ? []
                : Array.isArray(categories)
                ? categories
                : [+categories],
            take: +take,
            tags: tagId,
          })
          .then(
            (matches) => matches && this.handleResponse(matches, type, params)
          );
      }
      case ServiceClientQueryType.Guide: {
        return this.matchingClient
          .getGuide(guideId, { connectionId: connection })
          .then((guide) => {
            if (guide) {
              this.handleResponse(guide, type, params);
            }
          })
          .catch((e) => {
            const error = {
              message: 'Something went wrong.',
              status: e.status || 400,
            };
            if (error.status === 404) {
              error.message = 'The guide could not be found.';
            }
            this.handleResponse({}, type, params, error);
          });
      }
      case ServiceClientQueryType.Categories: {
        return this.matchingClient
          .getCategories({
            phrase: trimmedPhrase,
            expand: expandCategories,
            tags: tagId,
          })
          .then(
            (categories) =>
              categories && this.handleResponse(categories, type, params)
          );
      }
      case ServiceClientQueryType.Contacts: {
        if (guideId) {
          return this.matchingClient
            .contactMethods(+guideId, { phrase: trimmedPhrase })
            .then(
              (result) => result && this.handleResponse(result, type, params)
            );
        }
        return this.matchingClient
          .contacts(+contactMethodCategoryId, { phrase: trimmedPhrase })
          .then(
            (result) => result && this.handleResponse(result, type, params)
          );
      }
      case ServiceClientQueryType.ContactMethod: {
        return this.matchingClient
          .getContactMethod(+contactMethodId, { guideId, currentCategory })
          .then(
            (result) => result && this.handleResponse(result, type, params)
          );
      }
      case ServiceClientQueryType.Tags: {
        return this.matchingClient
          .customRequest('tags', 'GET', {
            configuration: {
              take: 999999,
              phrase: trimmedPhrase,
              categories:
                categories === '0'
                  ? []
                  : Array.isArray(categories)
                  ? categories
                  : [+categories],
            },
          })
          .then(
            (result) => result && this.handleResponse(result, type, params)
          );
      }
      case ServiceClientQueryType.TagsOnGuides: {
        return this.matchingClient
          .customRequest('tagsonguides', 'GET', {
            configuration: {
              take: 999999,
              phrase: trimmedPhrase,
              categories:
                categories === '0'
                  ? []
                  : Array.isArray(categories)
                  ? categories
                  : [+categories],
              tags: tagId,
            },
          })
          .then(
            (result) => result && this.handleResponse(result, type, params)
          );
      }
      case ServiceClientQueryType.Notifications: {
        return this.matchingClient
          .customRequest('notices', 'GET', {
            configuration: {
              phrase: trimmedPhrase,
              categories:
                categories === '0'
                  ? []
                  : Array.isArray(categories)
                  ? categories
                  : [+categories],
            },
          })
          .then(
            (result) => result && this.handleResponse(result, type, params)
          );
      }
    }
  }

  handleResponse(
    data: any = {},
    type: ServiceClientQueryType,
    params: QueryParameters,
    error?: DataError
  ) {
    const queries = this.queries.get(type) || [];
    const existing = queries.find((q) => shallowCompare(q.params, params));
    if (existing) {
      const formatted = error ? error : formatLegacyData(type, data);
      this.track(formatted, type, error);
      existing.resolvers.forEach((r) => {
        if (error) {
          r.reject({ error: formatted });
        } else {
          r.resolve(formatted);
        }
      });

      const index = queries.indexOf(existing);
      if (index > -1) {
        queries.splice(index, 1);
      }
      queries.push({
        ...existing,
        error,
        resolvers: [],
        data: formatted,
        resolved: true,
      });
      this.setLoadingStatus(type, params, false);
      this.queries.set(type, queries);
      if (!error) {
        this.events.dispatch('data-client:fetched', {
          type,
          params,
          response: formatted,
          unresolvedQueries: this.getUnresolvedQueries(),
        });
      }
    }
  }

  private fetchAllUnresolvedQueries() {
    for (const [queryType, queries] of this.queries) {
      queries
        .filter((query: Query) => !query.resolved)
        .forEach((query) => {
          this.runQuery(queryType, query.params);
        });
    }
  }

  private track(
    data: any = {},
    type: ServiceClientQueryType,
    error?: DataError
  ) {
    const widget = this.container.get('$widget');
    if (widget && !error) {
      widget.events.dispatch('tracking:service-client-response', {
        type,
        data,
      });
    } else if (widget) {
      widget.events.dispatch('tracking:service-client-error', {
        type,
        error,
      });
    }
  }

  static create(container: Container): Promise<DataClient> {
    return container.getAsync('matchingClient').then(async (matchingClient) => {
      if (matchingClient) {
        return new DataClient(container, matchingClient);
      }

      const client = await createServiceClient(container);
      container.registerAsync('matchingClient', () => client);

      return new DataClient(container, client);
    });
  }

  getClient() {
    return this.matchingClient;
  }
}
