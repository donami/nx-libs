import { uuid } from '@telia-ace/widget-utilities';
import { Container } from '@webprovisions/platform';
import {
  ActionItem,
  CustomMessageTypes,
  ListContent,
  MessageGroup,
  MessageGroupItem,
  ServerEntry,
} from './types';
import {
  contactMethodFromLegacy,
  createGroup,
  getListType,
  setServiceClientParameter,
} from './utils';
import { ConversationMessageListItemType } from '@telia-ace/widget-conversation-flamingo';

const createGroupItem = ({
  messageId,
  message,
  group,
}: {
  messageId: string;
  message: MessageGroupItem['message'];
  group: MessageGroup;
}) => {
  return {
    id: messageId,
    message,
    groupId: group.id,
    isUser: group.isUser,
  };
};

export const processEntries = async (
  container: Container,
  entries: ServerEntry[],
  prevGroup?: MessageGroup
) => {
  const createListContent = (
    listType: string,
    entry: ServerEntry,
    groupId: string,
    listContent: ListContent = {
      actions: [],
      entryId: entry.id,
      groupId,
    }
  ) => {
    const contactMethodIds: string[] = [];

    listContent.actions = entry.content.items.map((i: any) => {
      const action = {
        label: i.title,
        actionKey: i.actionKey,
        symbol: i.symbol ? i.symbol : undefined,
        description: i.description || undefined,
      } as ActionItem;

      if (i.data) {
        const entryAction = entry.actions[i.actionKey];
        if (listType === CustomMessageTypes.ContactList) {
          contactMethodIds.push(i.data.id);
          action.data = contactMethodFromLegacy(i.data, {
            guideId: entryAction?.guideId?.toString(),
          });
        } else {
          action.data = i.data;
        }
      }
      return action;
    });

    if (listType === CustomMessageTypes.ContactList) {
      listContent.contactMethodIds = contactMethodIds;
    }

    return listContent;
  };

  const transform = async (
    entry: ServerEntry,
    group: MessageGroup,
    related: ServerEntry[] = [],
    prevGroup?: MessageGroup
  ) => {
    const messageId = uuid();

    if (
      entry.type !== 'List' &&
      entry.tags.includes('guide') &&
      entry.content.hints?.[0]?.id
    ) {
      await setServiceClientParameter(
        container,
        'LastGuideId',
        entry.content.hints[0].id
      );
    }

    switch (entry.type) {
      case 'List':
        {
          const { header, items, html } = entry.content;

          const result = [];

          let listContent = {
            actions: [],
            entryId: entry.id,
            groupId: group.id,
          } as ListContent;

          if (header) {
            listContent.header = header;
          }

          if (items?.length > 0) {
            const listType = getListType(entry);
            listContent = createListContent(
              listType,
              entry,
              group.id,
              listContent
            );

            // entry has related entries
            if (related.length) {
              const pagingEntry = related.find((e) =>
                e.tags.includes('paging')
              );
              const fallbackEntry = related.find((e) =>
                e.tags.includes('fallback')
              );

              if (pagingEntry?.content) {
                group.meta.paging = {
                  actions: pagingEntry.actions,
                  items: pagingEntry.content.items,
                  localState: pagingEntry.localState,
                };
                pagingEntry.content.items.forEach((i: any) => {
                  listContent.actions.push({
                    label: i.title,
                    actionKey: i.actionKey,
                    data: {
                      groupId: prevGroup ? prevGroup.id : group.id,
                    },
                  });
                });
              }

              if (fallbackEntry) {
                const fallbackAction = fallbackEntry.content.items.find(
                  (i: any) => i.actionKey === 'help'
                );
                if (fallbackAction) {
                  result.push(
                    createGroupItem({
                      messageId,
                      message: [
                        ConversationMessageListItemType.Separator,
                        undefined,
                      ],
                      group,
                    })
                  );
                  result.push(
                    createGroupItem({
                      messageId,
                      message: [
                        CustomMessageTypes.NoGoodAlternative,
                        { body: fallbackAction.title },
                      ],
                      group,
                    })
                  );
                }
              }
            }

            result.unshift(
              createGroupItem({
                messageId,
                message: [listType, listContent],
                group,
              })
            );
          }

          if (html) {
            result.unshift(
              createGroupItem({
                messageId,
                message: [ConversationMessageListItemType.HTML, { body: html }],
                group,
              })
            );
          }

          return result;
        }
        break;
      case 'Text':
        {
          const result = [];
          result.push(
            createGroupItem({
              messageId,
              message: [
                ConversationMessageListItemType.HTML,
                { body: entry.content.html },
              ],
              group,
            })
          );

          // embedded contact methods
          if (related.length) {
            const contactMethodListEntry = related.find(
              (e) =>
                e.type === 'List' &&
                e.localState?.$type ===
                  'Humany.Matching.Bots.Conversations.States.ContactState, Humany.Matching'
            );

            const dialogListEntry = related.find((e) =>
              e.tags.includes('dialog')
            );
            const feedbackEntry = related.find((e) =>
              e.tags.includes('feedback')
            );
            const contactMethodEntry = related.find(
              (e) => e.tags.includes('contact') && e.type === 'Contact'
            );

            if (contactMethodEntry) {
              result.push(
                createGroupItem({
                  messageId,
                  message: [
                    CustomMessageTypes.ContactMethod,
                    {
                      contactMethodId: contactMethodEntry.content.id,
                      groupId: group.id,
                      guideId: contactMethodEntry.content.guideId,
                    },
                  ],
                  group,
                })
              );
            }

            if (dialogListEntry) {
              result.push(
                createGroupItem({
                  messageId,
                  message: [
                    ConversationMessageListItemType.ButtonList,
                    {
                      actions: dialogListEntry.content.items.map((i: any) => {
                        return {
                          label: i.title,
                          actionKey: i.actionKey,
                        };
                      }),
                    },
                  ],
                  group,
                })
              );
            }

            if (contactMethodListEntry) {
              const listContent = createListContent(
                CustomMessageTypes.ContactList,
                contactMethodListEntry,
                group.id
              );

              result.push(
                createGroupItem({
                  messageId,
                  message: [
                    ConversationMessageListItemType.Separator,
                    undefined,
                  ],
                  group,
                })
              );

              result.push(
                createGroupItem({
                  messageId,
                  message: [CustomMessageTypes.ContactList, listContent],
                  group,
                })
              );
            }

            if (feedbackEntry) {
              if (feedbackEntry.content.html) {
                result.push(
                  createGroupItem({
                    messageId,
                    group,
                    message: [
                      ConversationMessageListItemType.HTML,
                      {
                        body: feedbackEntry.content.html,
                      },
                    ],
                  })
                );
              }
              result.push(
                createGroupItem({
                  messageId,
                  group,
                  message: [
                    CustomMessageTypes.FeedbackList,
                    {
                      actions: feedbackEntry.content.items.map((i: any) => {
                        return {
                          actionKey: i.actionKey,
                          label: i.title,
                        };
                      }),
                    },
                  ],
                })
              );
            }
          }
          return result;
        }
        break;
      case 'Contact': {
        return [
          createGroupItem({
            messageId,
            message: [
              CustomMessageTypes.ContactMethod,
              {
                contactMethodId: entry.content.id,
                groupId: group.id,
                guideId: entry.content.guideId,
              },
            ],
            group,
          }),
        ];
      }
      case 'CategorizedNoticeList': {
        const result = [
          createGroupItem({
            messageId,
            message: [
              CustomMessageTypes.NotificationList,
              {
                id: entry.content.item.id.toString(),
                header: entry.content.item.title,
                items: entry.content.item.listNotices,
                symbol: entry.content.item.defaultIcon,
              },
            ],
            group,
          }),
        ];

        (entry.content.notices || []).forEach((notice: any) => {
          result.push(
            createGroupItem({
              messageId,
              message: [
                ConversationMessageListItemType.HTML,
                {
                  body: notice.body,
                },
              ],
              group,
            })
          );
        });

        return result;
      }
      case 'footerNotice': {
        return [
          createGroupItem({
            messageId,
            message: [
              ConversationMessageListItemType.HTML,
              {
                body: entry.content.item.body,
              },
            ],
            group,
          }),
        ];
      }
      case 'Error': {
        return [
          createGroupItem({
            messageId,
            message: [
              ConversationMessageListItemType.HTML,
              {
                body: entry.content.message || 'Something went wrong.',
              },
            ],
            group,
          }),
        ];
      }

      default:
        return [];
    }
  };

  const splitEntry = (entry: ServerEntry): ServerEntry | ServerEntry[] => {
    if (['CategorizedNoticeList', 'NoticeList'].includes(entry.type)) {
      return (entry.content.items || []).reduce((acc: any, item: any) => {
        if (!entry.content.isInitialNotices) {
          return acc;
        }
        acc.push({
          ...entry,
          id: uuid(),
          type: item.type || entry.type,
          content: {
            $type: entry.content.$type,
            isInitialNotices: entry.content.isInitialNotices,
            notices: item.notices,
            item,
          },
        });
        return acc;
      }, []);
    }
    return entry;
  };

  // map of in which order the messages should be displayed
  // lower numbers will be displayed above higher
  const sortMap = new Map<string, number>([
    ['Text', 1],
    ['List', 2],
    ['Contact', 3],
    ['CategorizedNoticeList', 10],
  ]);

  const result: MessageGroup[] = [];
  const filteredEntries = entries
    .sort((item, other) => {
      // sort the entries based on it's types sort value
      const defaultSortValue = 20;

      const sortValue = sortMap.get(item.type) || defaultSortValue;
      const sortValueOther = sortMap.get(other.type) || defaultSortValue;
      return sortValue - sortValueOther;
    })
    .filter((entry) => !entry.relation) // remove any "relation entries"
    .reduce<ServerEntry[]>((acc, entry) => {
      // some entries needs to be splitted into seperate groups
      return acc.concat(splitEntry(entry));
    }, []);

  // we dont want to display this type of entry
  // as we dont support it, and it was not supported in v4 either
  const isNonVisibleRelatedEntry = (e: ServerEntry) => {
    return typeof e.actions['selector'] !== 'undefined';
  };

  for (const entry of filteredEntries) {
    const relatedEntries = entries.filter(
      (other) => other.relation === entry.id && !isNonVisibleRelatedEntry(other)
    );
    const group = createGroup({ isUser: false });

    const items = await transform(entry, group, relatedEntries, prevGroup);
    items.forEach((item) => {
      group.items.push(item);
    });

    if (group.items.length) {
      result.push(group);
    }
  }
  return result;
};
