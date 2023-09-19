import {
  CategoryApiResponse,
  ContactApiResponse,
  ContactCategoriesApiResponse,
  ContactMethodApiResponse,
  GuideApiResponse,
  GuideCategoriesApiResponse,
  GuideMatchApiResponse,
  GuideViewApiResponse,
  NoticeApiResponse,
  NoticeListApiResponse,
  TagListApiResponse,
  ValidationApiResult,
} from '@telia-ace/knowledge-serviceclient';
// import { ContactMethodType as ContactMethod } from '@telia-ace/knowledge-widget-adapters';
// import {
//   Category,
//   DialogItem,
//   DialogItemType,
//   Guide,
//   Notification,
//   NotificationList,
//   Symbol,
//   Tag,
// } from '@telia-ace/widget-core';
// import { FormBuilder } from '@telia-ace/widget-forms';
import { DataError, ServiceClientQueryType } from './data-client';

type Category = any;
type DialogItem = any;
type Guide = any;
type Notification = any;
type NotificationList = any;
type SymbolType = any;
type Tag = any;

type ContactMethod = any;

enum DialogItemType {
  guide = 'guide',
  link = 'link',
  default = 'default',
}

export type MatchResult = {
  guides: Guide[];
  matches: number;
  topNotifications: Notification[];
  middleNotifications: Notification[];
  bottomNotifications: Notification[];
  notificationLists: NotificationList[];
  tags: Tag[];
  byCategory: { id: string; guides: Guide[]; matches: number }[];
};

export type TagsResult = Tag[];

export type CategoriesResult = {
  categories: Category[];
  matches: number;
};

export type NotificationResults = Pick<
  MatchResult,
  | 'topNotifications'
  | 'middleNotifications'
  | 'bottomNotifications'
  | 'notificationLists'
>;

export type GuideResult = {
  guide: {
    id: string;
    title: string;
    body: string;
    modified: string;
    modifiedBy: string | null;
    publishedBy: string | null;
    published: string;
    connection: string;
    categories: number[];
    hasHandover: boolean;
    allowFeedback: boolean;
    seoMetaDescription: string | null;
    seoAllowIndex: boolean | null;
    perspective: string | null;
    perspectives: { [key: string]: string };
    translations?: { [key: string]: string };
  };
  related: Guide[];
  dialog: DialogItem[];
  contactMethods: ContactMethod[];
  tags: Tag[];
  error?: DataError;
};

export type ContactsResult = {
  categories: Category[];
  contactMethods: ContactMethod[];
  topNotifications: Notification[];
  middleNotifications: Notification[];
  bottomNotifications: Notification[];
  notificationLists: NotificationList[];
};

export type SubmissionResult = {
  contactMethod?: ContactMethod;
  valid: boolean;
};

const convertLegacySymbol = (symbol?: {
  Type: string;
  Content: string;
}): SymbolType | undefined => {
  if (symbol) {
    const { Type, Content } = symbol;
    if (Type && Content) {
      return { type: Type, content: Content };
    }
  }
};

const mapLegacyCategoriesRecursively = (
  categories: CategoryApiResponse[]
): Category[] => {
  return categories.map((c) => {
    const category: Category = {
      id: c.Id.toString(),
      title: c.Name,
      symbol: convertLegacySymbol(c.DefaultIcon),
      activeSymbol: c.ActiveIcon && convertLegacySymbol(c.ActiveIcon),
      description:
        c.Description || (c.Attributes && c.Attributes.description) || '',
      matches: c.GuidesCount,
    };
    if (c.Children && c.Children.length) {
      category.items = mapLegacyCategoriesRecursively(c.Children);
    }
    return category;
  });
};

const mapNotices = (
  source: NoticeApiResponse[],
  type: string
): Notification[] => {
  return source
    .filter(({ Type }) => Type === type)
    .map(({ Id, Title, Body }) => ({
      id: Id.toString(),
      title: Title,
      body: Body,
    }));
};

const mapNotificationLists = (
  source: NoticeListApiResponse[]
): NotificationList[] => {
  return source.map(({ Id, Title, DefaultIcon, ListNotices, Notices }) => ({
    id: Id.toString(),
    title: Title,
    symbol: convertLegacySymbol(DefaultIcon),
    defaultHeaderOptions: {
      visible: !!ListNotices.length,
    },
    notifications: (ListNotices || [])
      .concat(Notices || [])
      .map(({ Id, Title, Body, Type, Modified }: any) => ({
        id: Id.toString(),
        title: Title,
        body: Body,
        modified: Modified,
        expandable: Type === 'listNotice',
      })),
  }));
};

const mapContactMethodSettings = (
  {
    Id,
    Title,
    DefaultIcon,
    Exits: [Exit],
    ExitType,
    ConfirmationText,
    Description,
  }: ContactApiResponse,
  _Validation?: ValidationApiResult
): ContactMethod => {
  const { Adapter } = Exit || { Adapter: {} };
  const { ClientName = '', Settings = {}, CustomClientName = '' } = Adapter;

  const settings: ContactMethod = {
    id: Id.toString(),
    title: Title,
    description: Description,
    symbol: convertLegacySymbol(DefaultIcon),
    clientName: ClientName === 'custom.adapter' ? CustomClientName : ClientName,
    expanded: true,
    inline: true,
    body: {},
  };

  if (ClientName.indexOf('phone') > -1 || ClientName.indexOf('freetext') > -1) {
    const { displayTextBeforeClick, textBeforeClick } = Settings;
    if (displayTextBeforeClick === 'true') {
      settings.expanded = false;
      settings.title = textBeforeClick;
    }

    if (ClientName.indexOf('phone.text') > -1) {
      settings.body.phoneNumber = Settings.phoneNumber;
    } else {
      settings.body.freetext = Settings.freetext;
    }
  }

  if (
    ClientName.indexOf('chat.popup') > -1 ||
    ClientName.indexOf('link') > -1 ||
    (ClientName === 'custom.adapter' && ExitType === 'custom')
  ) {
    settings.body = Settings;
    settings.body.confirmationFallback = ConfirmationText;
  }

  if (ClientName.indexOf('ace') > -1) {
    settings.body = Settings;
  }

  // if (Form && Form.HasValueComponents) { // TODO:
  //   if (Validation) {
  //     settings.body.form = FormBuilder.fromLegacyForm(
  //       Id.toString(),
  //       Form,
  //       Validation
  //     ).get();
  //   } else {
  //     settings.body.form = FormBuilder.fromLegacyForm(
  //       Id.toString(),
  //       Form
  //     ).get();
  //   }
  //   if (!ExpandFormAutomatically) {
  //     settings.expanded = settings.inline = false;
  //   }
  // }

  return settings;
};

type Modify<T, R> = Omit<T, keyof R> & R;
type ExtendedGuideMatchApiResponse = Modify<
  GuideMatchApiResponse,
  {
    ByCategory: {
      Id: string;
      Matches: GuideApiResponse[];
      TotalMatches: number;
    }[];
  }
>;

const mapTags = (tags: TagListApiResponse[] = []): Tag[] => {
  return tags.map(
    ({ Id, Title, TotalMatches, Symbol, DefaultIcon, ActiveIcon }) => ({
      id: Id.toString(),
      title: Title,
      matches: TotalMatches,
      symbol: convertLegacySymbol(DefaultIcon || Symbol),
      defaultIcon: convertLegacySymbol(DefaultIcon),
      activeIcon: convertLegacySymbol(ActiveIcon),
    })
  );
};

const mapGuides = (guides: GuideApiResponse[]) => {
  return guides.map(({ Id, Title, Tags, FirstPublishedDate, Modified }) => ({
    id: Id.toString(),
    title: Title,
    tags: mapTags(Tags),
    published: FirstPublishedDate,
    modified: Modified,
  }));
};

export const formatLegacyData = (type: ServiceClientQueryType, data: any) => {
  switch (type) {
    case ServiceClientQueryType.MatchByCategory:
    case ServiceClientQueryType.Match: {
      const result: MatchResult = {
        guides: [],
        matches: 0,
        topNotifications: [],
        middleNotifications: [],
        bottomNotifications: [],
        notificationLists: [],
        tags: [],
        byCategory: [],
      };
      const {
        Matches,
        TotalMatches,
        Notices,
        NoticeLists,
        Tags,
        ByCategory,
      }: ExtendedGuideMatchApiResponse = data;

      result.guides = mapGuides(Matches);

      result.matches = TotalMatches;

      result.byCategory = (ByCategory || []).map(
        ({ Id, Matches, TotalMatches }) => ({
          id: Id,
          guides: mapGuides(Matches),
          matches: TotalMatches,
        })
      );

      result.tags = mapTags(Tags);

      result.notificationLists = mapNotificationLists(NoticeLists || []);

      result.topNotifications = mapNotices(Notices || [], 'noticeRowTop');

      result.middleNotifications = mapNotices(Notices || [], 'noticeRowMiddle');

      result.bottomNotifications = mapNotices(Notices || [], 'footerNotice');

      return result;
    }
    case ServiceClientQueryType.Categories: {
      const { Children, GuidesCountTotal }: GuideCategoriesApiResponse = data;

      const result: CategoriesResult = {
        categories: mapLegacyCategoriesRecursively(Children || []),
        matches: GuidesCountTotal,
      };

      return result;
    }
    case ServiceClientQueryType.Guide: {
      const {
        Id,
        Title,
        Body,
        Related,
        Options,
        ConnectionId,
        ContactMethods,
        EnableFeedback,
        HandoverExists,
        FirstPublishedDate,
        Modified,
        ModifiedByDisplayName,
        FirstPublishedByDisplayName,
        Categories,
        Tags,
        SeoMetaDescription,
        SeoAllowIndex,
        Perspectives,
        PerspectiveKey,
        Translations,
      }: GuideViewApiResponse = data;

      /*
      PerspectiveKey is always null when on the "top level" of a dialog tree
      OR when navigating down a dialog tree in the "Default answer version"
      Note: The "Default answer version" is not the same as a given guides
      default answer version. The "Default answer version" is always the answer
      version in Perspectives with the key "Default".
    */
      const perspective =
        PerspectiveKey ||
        Object.values(Perspectives).find(
          (connection) => connection === ConnectionId
        ) ||
        Perspectives['Default'] ||
        null;

      const result: GuideResult = {
        guide: {
          id: Id.toString(),
          title: Title,
          body: Body,
          modified: Modified,
          published: FirstPublishedDate,
          modifiedBy: ModifiedByDisplayName,
          publishedBy: FirstPublishedByDisplayName,
          connection: ConnectionId,
          categories: Categories,
          hasHandover: HandoverExists,
          allowFeedback: EnableFeedback,
          seoMetaDescription: SeoMetaDescription,
          seoAllowIndex: SeoAllowIndex,
          perspectives: Perspectives,
          perspective,
          translations: Object.keys(Translations || {}).reduce<{
            [key: string]: string;
          }>((acc, key) => {
            acc[key] = Translations[key].toString();
            return acc;
          }, {}),
        },
        related: mapGuides(Related || []),
        dialog: [],
        contactMethods: (ContactMethods || []).map((cm) =>
          mapContactMethodSettings(cm)
        ),
        tags: mapTags(Tags),
      };

      (Options || []).forEach(
        ({ CanAccess, Description, ConnectionId, Properties }) => {
          if (!CanAccess) {
            return;
          }

          const item: DialogItem = {
            id: Id.toString(),
            title: Description,
            connection: ConnectionId,
            connectionKey: (Properties as any).ConnectionKey,
            type: DialogItemType.default,
            parent: {
              id: Id.toString(),
              title: Title,
              tags: mapTags(Tags),
            },
          };

          if (Properties.Type === 'Guide' || Properties.Type === 'Link') {
            Properties.Id && (item.id = Properties.Id.toString());
            Properties.Uri && (item.href = Properties.Uri);
            Properties.Target && (item.target = Properties.Target);
            switch (Properties.Type) {
              case 'Guide':
                item.type = DialogItemType.guide;
                break;
              case 'Link':
                item.type = DialogItemType.link;
                break;
            }
          }

          result.dialog.push(item);
        }
      );

      return result;
    }
    case ServiceClientQueryType.Contacts: {
      const {
        Children,
        Matches,
        Notices,
        NoticeLists,
      }: ContactCategoriesApiResponse = data;

      const result: ContactsResult = {
        contactMethods: (Matches || []).map((cm) =>
          mapContactMethodSettings(cm)
        ),
        categories: mapLegacyCategoriesRecursively(Children || []),
        topNotifications: mapNotices(Notices || [], 'noticeRowTop'),
        middleNotifications: mapNotices(Notices || [], 'noticeRowMiddle'),
        bottomNotifications: mapNotices(Notices || [], 'footerNotice'),
        notificationLists: mapNotificationLists(NoticeLists || []),
      };

      return result;
    }
    case ServiceClientQueryType.ContactMethod: {
      const { ContactMethod }: ContactMethodApiResponse = data;

      return mapContactMethodSettings(ContactMethod || {});
    }
    case ServiceClientQueryType.Tags:
    case ServiceClientQueryType.TagsOnGuides: {
      return mapTags(data || []);
    }
    case ServiceClientQueryType.Notifications: {
      const { Notices, NoticeLists } = data;

      return {
        topNotifications: mapNotices(Notices || [], 'noticeRowTop'),
        middleNotifications: mapNotices(Notices || [], 'noticeRowMiddle'),
        bottomNotifications: mapNotices(Notices || [], 'footerNotice'),
        notificationLists: mapNotificationLists(NoticeLists || []),
      };
    }
    default:
      return {};
  }
};
