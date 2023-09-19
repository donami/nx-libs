import { EventSubscriptionCancellation, Widget } from '@webprovisions/platform';

export type EntityValueResolver = (value: any) => void;
export type ResolveEntityValueHandler = (
  resolve: EntityValueResolver,
  originalValue: any
) => any | Promise<any>;

/**
 * Registers a handler to resolve entity values initiated by the backend service.
 * @param widget Widget to resolve the entity value for.
 * @param name Name of entity to resolve.
 * @param handler Handler for resolving value.
 */
export const resolveEntityValue = (
  widget: Widget,
  name: string,
  handler: ResolveEntityValueHandler
): EventSubscriptionCancellation => {
  return widget.events.subscribe(
    'data:resolve-entity-value',
    (_event, data) => {
      if (data.name === name) {
        return new Promise<void>((resolve) => {
          handler((value: any) => {
            data.value = value;
            resolve();
          }, data.value);
        });
      }
    }
  );
};
