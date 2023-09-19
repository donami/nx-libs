// import { FormBuilder, submitButton } from '@telia-ace/widget-forms';
import { uuid } from '@telia-ace/widget-utilities';
import { Container } from '@webprovisions/platform';
import {
  CustomMessageTypes,
  MessageGroup,
  MessageGroupItem,
  ServerEntry,
} from './types';
import { ConversationMessageListItemType } from '@telia-ace/widget-conversation-flamingo';

type Symbol = {
  type: 'Uri' | 'Svg' | 'FontAwesome' | 'Text' | string;
  content: string;
};

const convertLegacySymbol = (symbol?: {
  type: string;
  content: string;
}): Symbol | undefined => {
  if (symbol) {
    const { type, content } = symbol;
    if (type && content) {
      return { type, content };
    }
  }
};

export const createGroup = ({
  isUser,
  items = [],
  meta = {},
}: {
  isUser: boolean;
  items?: Partial<MessageGroupItem>[];
  meta?: MessageGroup['meta'];
}) => {
  const groupId = uuid();

  const group = {
    id: groupId,
    isUser,
    items: items.map((i) => {
      return {
        id: i.id || uuid(),
        isUser: isUser,
        groupId: groupId,
        message: i.message || [],
      };
    }),
    meta,
  } as MessageGroup;

  return group;
};

export const contactMethodFromLegacy = (
  {
    id,
    title,
    defaultIcon,
    exits: [exit],
    exitType,
    confirmationText,
    expandFormAutomatically,
    form,
    description,
  }: any,
  options: {
    validation?: any;
    guideId?: string;
  } = {}
): any => {
  const { adapter } = exit || { Adapter: {} };
  const {
    clientName = '',
    settings: adapterSettings = {},
    customClientName = '',
  } = adapter;
  // const { validation } = options;

  const settings: any = {
    id: id.toString(),
    title: title,
    description: description,
    symbol: convertLegacySymbol(defaultIcon),
    clientName: clientName === 'custom.adapter' ? customClientName : clientName,
    expanded: true,
    inline: true,
    body: {},
  };

  if (clientName.indexOf('phone') > -1 || clientName.indexOf('freetext') > -1) {
    const { displayTextBeforeClick, textBeforeClick } = adapterSettings;
    if (displayTextBeforeClick === 'true') {
      settings.expanded = false;
      settings.title = textBeforeClick;
    }

    if (clientName.indexOf('phone.text') > -1) {
      settings.body.phoneNumber = adapterSettings.phoneNumber;
    } else {
      settings.body.freetext = adapterSettings.freetext;
    }
  }

  if (
    clientName.indexOf('chat.popup') > -1 ||
    clientName.indexOf('link') > -1 ||
    (clientName === 'custom.adapter' && exitType === 'custom')
  ) {
    settings.body = adapterSettings;
    settings.body.confirmationFallback = confirmationText;
  }

  if (clientName.indexOf('ace') > -1) {
    settings.body = adapterSettings;
  }

  if (form && form.hasValueComponents) {
    // if (validation) {
    //   settings.body.form = FormBuilder.fromLegacyForm(
    //     id.toString(),
    //     form,
    //     validation
    //   ).get();
    // } else {
    //   settings.body.form = FormBuilder.fromLegacyForm(
    //     id.toString(),
    //     form
    //   ).get();
    // }
    if (!expandFormAutomatically) {
      settings.expanded = settings.inline = false;
    }

    settings.body = updateForm(settings, { submit: 'Submit' });
  }

  if (options.guideId) {
    settings.body.guideId = options.guideId;
  }

  return settings;
};

export const getListType = (entry: ServerEntry) => {
  const { localState: state } = entry;

  if (entry.tags.includes('category') && entry.tags.includes('contact')) {
    return ConversationMessageListItemType.ItemList;
  }

  if (entry.tags.includes('suggestion')) {
    return ConversationMessageListItemType.LinkList;
  }

  if (
    state?.$type ===
    'Humany.Matching.Bots.Conversations.GuideListState, Humany.Matching'
  ) {
    return ConversationMessageListItemType.LinkList;
  } else if (
    state?.$type ===
    'Humany.Matching.Bots.Conversations.States.GuideFeedbackState, Humany.Matching'
  ) {
    return CustomMessageTypes.FeedbackList;
  } else if (
    state?.$type ===
    'Humany.Matching.Bots.Conversations.States.ContactState, Humany.Matching'
  ) {
    return CustomMessageTypes.ContactList;
  } else return ConversationMessageListItemType.ButtonList;
};

export const getKnowledgeBotEndpoint = (
  container: Container,
  component: any /*: ComponentNodeController */
) => {
  const { knowledgeBotEndpoint } = component.properties();

  if (knowledgeBotEndpoint) {
    return `${knowledgeBotEndpoint}/conversations`;
  }

  const { data } = container.get('$settings');

  if (!data || !data.projection)
    throw new Error('Missing Knowledge Bot endpoint');

  return `${data.projection}/conversations`;
};

export const updateForm = (
  contactMethod: any,
  {
    submit: _submit,
    errors: _errors,
    meta: _meta,
  }: {
    submit: string;
    errors?: { [key: string]: string };
    meta?: { [key: string]: string };
  }
): any => {
  // if (contactMethod?.body?.form) {
  //   const { body } = contactMethod;
  //   const builder = new FormBuilder(body.form);

  //   if (!body.form.layout.submit) {
  //     builder.createComponent(submitButton(submit, 'submit'));
  //   }

  //   if (errors) {
  //     builder.setValidationErrors(errors);
  //   }

  //   if (meta) {
  //     (builder as any).setMeta(meta);
  //   }

  //   return {
  //     ...body,
  //     form: builder.get(),
  //   };
  // }
  return contactMethod?.body || {};
};

// since we interacting with knowledge through the /conversations endpoint
// and not using the service client we sync parameters here
export const setServiceClientParameter = async (
  container: Container,
  key: string,
  value: string
) => {
  const dataClient = await container.getAsync('dataClient');
  const matchingClient = await dataClient.getClient();
  matchingClient.parameters.set(key, value);
};
