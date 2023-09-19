import {
  ActionResolver,
  ComponentPlatform,
  WidgetRenderState,
  WidgetSettings,
} from '@telia-ace/widget-core';
import {
  StorageCategory,
  StorageMedium,
  StorageScope,
  createStorageWriter,
  readStorage,
} from '@telia-ace/widget-services';
import { uuid } from '@telia-ace/widget-utilities';
import {
  BootstrappingActivationData,
  supportBootstrapping,
} from '@webprovisions/bootstrapping';
import {
  Container,
  EventSubscriptionCancellation,
  WidgetType,
} from '@webprovisions/platform';
import {
  BadgeOptions,
  ViewOutlet,
  ViewOutletOptions,
} from '././ui/view-outlet';
import {
  createActionResolver,
  createComponentPlatform,
  createComponentResolver,
  createStorageService,
} from './services';
import { setActive, setInactive } from './ui/html-element-handlers';
import {
  TriggerType,
  determineTriggerType,
  prepareDOMElements,
} from './ui/prepare-dom';

const SETTINGS_STORAGE_KEY = '$settings';
const OPEN_STORAGE_KEY = 'open';
const STICKY_WIDGET_STORAGE_KEY = 'activeStickyWidget';

export enum InitialRenderState {
  Open = 'open',
  Closed = 'closed',
  Hidden = 'hidden',
  Storage = 'storage',
}

export type RenderData = {
  widgetDOMElement?: HTMLElement;
  triggerDOMElement?: HTMLElement;
  key?: string;
  open?: boolean;
  withRenderState?: InitialRenderState;
};

export type AttachData = {
  widgetDOMElement?: HTMLElement;
  triggerDOMElement?: HTMLElement;
  key?: string;
  withRenderState?: InitialRenderState;
};

export default class Widget extends WidgetType {
  outlets = new Map<string, ViewOutlet>();
  activated: Promise<void> | undefined = undefined;
  subs: EventSubscriptionCancellation[] = [];

  constructor(container: Container) {
    super(container);

    this.container.registerAsync('storage', () =>
      createStorageService(this.container)
    );

    this.container.registerFactory('settings', () => {
      return readStorage<Partial<WidgetSettings>>(
        this.container,
        SETTINGS_STORAGE_KEY,
        StorageMedium.Local
      ).then((settings = {}) => {
        return {
          ...this.container.get('$settings'),
          ...settings,
        };
      });
    });

    supportBootstrapping(this as any, 'load', this.handleBootstrapping);

    this.container.registerAsync('componentResolver', () =>
      createComponentResolver(this.container)
    );
    this.container.registerAsync('actionResolver', () =>
      createActionResolver(this.container)
    );
    this.container.register('matchMedia', window.matchMedia);
    this.container.registerAsync('components', () =>
      createComponentPlatform(this.container)
    );
  }

  handleBootstrapping = (activationData: BootstrappingActivationData) => {
    const options = {
      triggerDOMElement: activationData.sourceDOMElement,
      withRenderState: InitialRenderState.Storage,
    };

    this.container.get('settings').then((settings: any) => {
      const { activate } = settings;
      const shouldActivate =
        typeof activate === 'undefined' ||
        activate === null ||
        activate === true;

      if (shouldActivate) {
        this.activated = (this.activated || this.widget.activate()).then(() =>
          this.attach(options)
        );
      }
    });
  };

  initialize() {
    const promises = this.container.getManyAsync(
      'actionResolver',
      'components'
    ) as Promise<{
      actionResolver: ActionResolver;
      components: ComponentPlatform;
    }>;

    const cspSettings: { nonce: string } | undefined =
      this.container.get('csp');
    if (cspSettings) {
      if (!(window as any).webprovisionsEnvironmentVariables) {
        (window as any).webprovisionsEnvironmentVariables = {};
      }
      (window as any).webprovisionsEnvironmentVariables['cspNonce'] =
        cspSettings.nonce;
    }

    return Promise.all([promises, this.container.get('settings')]).then(
      ([{ actionResolver, components }, _settings]) => {
        actionResolver.subscribe(this.widget.name, (_origin, action, value) =>
          this.onAction(action, value)
        );

        const switchViewNodes = (routeName: string) => {
          components.nodes.query({ type: 'view' }).forEach((viewNode) => {
            components.setSwitch(viewNode, routeName);
          });
        };

        // const initialRoute = router.getInitialRoute()?.name || 'index';
        const initialRoute = 'index';
        switchViewNodes(initialRoute);

        this.events.subscribe('widget:data-loaded', (_e, { element }) => {
          if (this.widget.container.get('seoConfiguration')) {
            this.events.dispatch('widget:preloaded-replaced', {
              element,
            });
          }
        });

        // this.events.subscribe(
        //   'router:change',
        //   (_e, { previous = { routeData: {} }, next = { routeData: {} } }) => {
        //     const { routeData: prevData }: { routeData: RouteData } = previous;
        //     const { routeData: nextData }: { routeData: RouteData } = next;

        //     const notFoundView = Object.keys(settings.views).reduce(
        //       (acc, key) => {
        //         const view = settings.views[key];
        //         if (typeof view.path === 'undefined') {
        //           return key;
        //         }
        //         return acc;
        //       },
        //       ''
        //     );

        //     // route not found
        //     if (!nextData.name && notFoundView) {
        //       switchViewNodes(notFoundView);
        //     } else {
        //       switchViewNodes(nextData.name);
        //     }

        //     removeNullAndUndefinedValues(prevData && prevData.params);
        //     removeNullAndUndefinedValues(nextData && nextData.params);

        //     this.container
        //       .getAsync('actionResolver')
        //       .then((actionResolver: ActionResolver) => {
        //         actionResolver.action(this.widget.name, 'routeChange', {
        //           next: nextData,
        //           previous: prevData,
        //         });
        //       });
        //   }
        // );

        // return router.initialize();
        return Promise.resolve();
      }
    );
  }

  attach(attachData: AttachData = {}) {
    return this.container
      .get('settings')
      .then(async ({ trigger }: WidgetSettings) => {
        const {
          widgetDOMElement,
          key = uuid(),
          triggerDOMElement,
          withRenderState,
        } = attachData;

        const triggerType = determineTriggerType(trigger);

        // This could probably be defined already when bootstrapping occurs,
        // Webprovisions knows when a widget is prerendered,
        // see "queryPrerenderedTargets in @webprovisions/bootstrapping"
        const waitWithReplace =
          triggerType === TriggerType.Inline &&
          (triggerDOMElement?.childElementCount || 0) > 0;

        const outletOptions = await prepareDOMElements(
          this.container,
          this.widget.name,
          widgetDOMElement,
          triggerDOMElement,
          trigger,
          waitWithReplace
        );

        if (this.outlets.size < 1 && !withRenderState) {
          this.setRenderState('unset');
        }

        const swap = () => {
          const isReady = () =>
            widgetDOMElement.querySelectorAll('[data-loading=true]').length ===
            0;
          const [widgetDOMElement] =
            this.widget.container.get('widgetDOMElements');

          const watcher = (
            _mutations: MutationRecord[],
            observer: MutationObserver
          ) => {
            if (isReady()) {
              if (outletOptions.callback) {
                outletOptions.callback();
              }
              observer.disconnect();
            }
          };
          const options = {
            attributes: true,
            subtree: true,
            childList: true,
          };

          if (isReady()) {
            outletOptions.callback && outletOptions.callback();
          }
          const observer = new MutationObserver(watcher);

          observer.observe(widgetDOMElement, options);
        };

        if (waitWithReplace) {
          this.widget.container
            .getAsync('dataClient')
            .then(({ events }: any) => {
              events.subscribe(
                'data-client:fetched',
                (_event: any, data: any) => {
                  if (data.unresolvedQueries === 0) {
                    swap();
                  }
                }
              );
            });
        }

        const outlet = this.getOrCreateViewOutlet(key, outletOptions);
        this.outlets.set(key, outlet);
        this.widget.events.dispatch('widget:attached', {}, { bubbles: true });

        if (outletOptions.triggerType === TriggerType.Badge && trigger) {
          outletOptions.triggerDOMElement?.setAttribute(
            'aria-expanded',
            'false'
          );
          outlet?.renderBadge(trigger);
        }

        if (outletOptions.triggerType !== TriggerType.Inline) {
          outletOptions.triggerDOMElement?.addEventListener(
            'click',
            (event: any) => {
              event.preventDefault();
              this.container
                .get('settings')
                .then(({ trigger: updatedTrigger }: WidgetSettings) => {
                  outlet
                    .render()
                    .then(() => this.renderState())
                    .then((renderState) => {
                      if (
                        updatedTrigger &&
                        updatedTrigger.action &&
                        updatedTrigger.action === 'hide'
                      ) {
                        return renderState === WidgetRenderState.open
                          ? this.hide()
                          : this.open();
                      }
                      return renderState === WidgetRenderState.open
                        ? this.close()
                        : this.open();
                    });
                });
            }
          );
        }

        if (this.outlets.size > 1) {
          return this.renderState().then((state: WidgetRenderState) => {
            // new outlets should have the same state as existing ones
            this.triggerStateIfApplicable(state);
          });
        }

        if (withRenderState) {
          if (withRenderState === InitialRenderState.Storage) {
            return this.renderState().then((state: WidgetRenderState) => {
              if (outletOptions.triggerType === TriggerType.Inline) {
                this.triggerStateIfApplicable('open');
                return;
              }
              this.triggerStateIfApplicable(state);
            });
          }
          return this.triggerStateIfApplicable(withRenderState);
        }

        return;
      });
  }

  detach(key?: string) {
    if (key) {
      if (this.outlets.has(key)) {
        const outlet = this.outlets.get(key);
        outlet?.dispose();
        this.outlets.delete(key);
        return;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`detach(): Could not find View Outlet with key ${key}`);
      }
      return;
    }
    this.outlets.forEach((outlet) => {
      outlet.dispose();
    });
    this.outlets.clear();
  }

  private triggerStateIfApplicable(input: string) {
    switch (input) {
      case 'closed':
        this.close();
        break;
      case 'open':
        this.open();
        break;
      case 'hidden':
        this.hide();
        break;
      default:
        return;
    }
  }

  private getOrCreateViewOutlet(
    key: string,
    options: ViewOutletOptions
  ): ViewOutlet {
    return (
      this.outlets.has(key)
        ? this.outlets.get(key)
        : new ViewOutlet(this.container, options)
    )!;
  }

  render(renderData: RenderData = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'widget.render() is deprecated. Use widget.attach() instead.'
      );
    }
    if (renderData.open) {
      const options: AttachData = {
        ...renderData,
        withRenderState: InitialRenderState.Open,
      };
      return this.attach(options);
    }
    return this.attach(renderData);
  }

  activate(data?: any) {
    if (data?.override) {
      this.setSettings(() => data.override);
    }
    // TODO: this is considered a hack, remove apiNotificationPriorityBy
    // when there is a better way to get notifications from backend
    if (data?.apiNotificationPriorityBy) {
      this.container.register(
        'apiNotificationPriorityBy',
        data.apiNotificationPriorityBy
      );
    }
  }

  setSettings(
    fn: (settings: WidgetSettings) => Promise<Partial<WidgetSettings>>
  ): Promise<WidgetSettings> {
    return Promise.all([
      this.container.get('settings'),
      createStorageWriter(
        this.container,
        SETTINGS_STORAGE_KEY,
        StorageCategory.Necessary,
        {
          medium: StorageMedium.Local,
        }
      ),
    ]).then(([settings, write]) => {
      return Promise.resolve(fn(settings)).then((override) => {
        return write(override).then(() => {
          const updated = { ...settings, ...override };
          this.widget.events.dispatch('widget:settings-updated', updated);
          return updated;
        });
      });
    });
  }

  clearSettings(): Promise<void> {
    return createStorageWriter(
      this.container,
      SETTINGS_STORAGE_KEY,
      StorageCategory.Necessary,
      { medium: StorageMedium.Local }
    )
      .then((write) => write())
      .then(() => this.container.get('settings'))
      .then((settings) => {
        this.widget.events.dispatch('widget:settings-updated', settings);
      });
  }

  action({ action, value }: { action: string; value?: any }) {
    return this.container
      .getAsync('actionResolver')
      .then((actionResolver: ActionResolver) => {
        actionResolver.action(this.widget.name, action, value);
      });
  }

  renderState(): Promise<WidgetRenderState> {
    // if (onWidgetUrl(this.container)) {
    //   return Promise.resolve(WidgetRenderState.open);
    // }
    const readSessionOpen = () =>
      readStorage<WidgetRenderState>(
        this.container,
        OPEN_STORAGE_KEY,
        StorageMedium.Session
      ).then((value = WidgetRenderState.closed) => value);

    // const readLocalOpen = () =>
    //   readStorage<WidgetRenderState>(
    //     this.container,
    //     OPEN_STORAGE_KEY,
    //     StorageMedium.Session
    //   ).then((value = WidgetRenderState.closed) => value);

    // return this.container.getAsync('router').then((routing: RoutingService) => {
    //   if (routing.isSticky()) {
    //     return readLocalOpen().then((localOpen) => {
    //       return localOpen === WidgetRenderState.open
    //         ? localOpen
    //         : readSessionOpen();
    //     });
    //   }
    //   return readSessionOpen();
    // });
    return readSessionOpen();
  }

  hide(): Promise<void> {
    if (this.outlets.size < 1) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'hide(): No-op as no view outlets are registered. Invoke the attach() command first.'
        );
      }
      return Promise.resolve();
    }
    this.outlets.forEach((outlet) => outlet.render());
    return this.action({ action: 'hide' }).then(() => {
      this.setTriggerState(false);
    });
  }

  open(): Promise<void> {
    if (this.outlets.size < 1) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'open(): No-op as no view outlets are registered. Invoke the attach() command first.'
        );
      }
      return Promise.resolve();
    }
    this.outlets.forEach((outlet) => outlet.render());
    return this.action({ action: 'open' }).then(() => {
      this.widget.events.dispatch('tracking:widget-rendered', {});
      return this.onOpen();
    });
  }

  close(): Promise<void> {
    if (this.outlets.size < 1) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'close(): No-op as no view outlets are registered. Invoke the attach() command first.'
        );
      }
      return Promise.resolve();
    }
    return this.action({ action: 'close' }).then(() => this.onClose());
  }

  show(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'show(): Command is deprecated and will be removed in the future. Use open() instead.'
      );
    }
    return this.open();
  }

  private onAction(action: string, _value: any) {
    switch (action) {
      case 'close':
      case 'open':
      case 'hide':
        // eslint-disable-next-line no-case-declarations
        const newState =
          action === 'open'
            ? WidgetRenderState.open
            : action === 'close'
            ? WidgetRenderState.closed
            : WidgetRenderState.hidden;

        return this.setRenderState(newState).then(() => {
          this.setTriggerState(newState === WidgetRenderState.open);
          if (newState !== WidgetRenderState.hidden) {
            newState === WidgetRenderState.open
              ? this.onOpen()
              : this.onClose();
          } else {
            this.outlets.forEach((outlet) =>
              outlet.options.triggerDOMElement?.setAttribute(
                'aria-expanded',
                'false'
              )
            );
          }
        });
    }
    return;
  }

  private setRenderState(newState: string): Promise<void> {
    const { invoke, events } = this.container.get('$widget');
    return Promise.all([
      createStorageWriter(
        this.container,
        OPEN_STORAGE_KEY,
        StorageCategory.Necessary,
        {
          medium: StorageMedium.Session,
        }
      ),
      createStorageWriter(
        this.container,
        OPEN_STORAGE_KEY,
        StorageCategory.Necessary,
        {
          medium: StorageMedium.Local,
          duration: { minutes: 5 },
        }
      ),
      invoke('renderState'),
    ]).then(([writeSessionOpen, writeLocalOpen, previousRenderState]) => {
      if (newState === 'unset' || !newState) {
        writeLocalOpen();
        writeSessionOpen();
      } else {
        writeSessionOpen(newState);
      }
      events.dispatch('widget:render-state-changed', {
        previous: previousRenderState,
        next: newState,
      });
    });
  }

  private onOpen(): Promise<void> {
    // return this.container.getAsync('router').then((router: RoutingService) => {
    //   this.outlets.forEach(
    //     (outlet) =>
    //       outlet.options.triggerDOMElement?.setAttribute(
    //         'aria-expanded',
    //         'true'
    //       )
    //   );
    //   return router.start();
    // });

    this.outlets.forEach((outlet) =>
      outlet.options.triggerDOMElement?.setAttribute('aria-expanded', 'true')
    );
    return Promise.resolve();
  }

  private onClose(): Promise<void> {
    const services = this.container.getManyAsync('components') as Promise<{
      components: ComponentPlatform;
    }>;

    const resetActivateProp = () => {
      return this.container
        .get('settings')
        .then((widgetSettings: WidgetSettings) => {
          const { activate } = this.container.get('$settings');
          if (widgetSettings.activate !== activate) {
            return this.setSettings(() => Promise.resolve({ activate }));
          }
          return Promise.resolve();
        });
    };

    return resetActivateProp()
      .then(() => {
        return services;
      })
      .then(
        ({ components: _components }: { components: ComponentPlatform }) => {
          // const visibleNodes = components.nodes.visible;
          this.outlets.forEach((outlet) =>
            outlet.options.triggerDOMElement?.setAttribute(
              'aria-expanded',
              'false'
            )
          );

          // if (
          //   visibleNodes.filter(
          //     (c) =>
          //       c.attributes.properties.animation &&
          //       c.attributes.properties.animation !== 'none'
          //   ).length
          // ) {
          //   return new Promise<RoutingService>((resolve) => {
          //     setTimeout(() => {
          //       resolve(router);
          //     }, 200);
          //   });
          // }

          // return Promise.resolve(router);
        }
      );
    // .then((router: RoutingService) => router.stop());
  }

  private setTriggerState(open: boolean) {
    this.outlets.forEach((outlet) => {
      const {
        options: { triggerDOMElement, triggerOptions },
      } = outlet;
      const { openTooltip, closedTooltip } =
        (triggerOptions as BadgeOptions) || {};
      if (triggerDOMElement) {
        open
          ? setActive(triggerDOMElement, openTooltip)
          : setInactive(triggerDOMElement, closedTooltip);
      }
    });
  }

  deactivate() {
    this.subs.forEach((s) => s());

    const promises: Promise<void>[] = [];
    this.outlets.forEach((outlet) => promises.push(outlet.dispose()));

    return readStorage<string>(
      this.container,
      STICKY_WIDGET_STORAGE_KEY,
      StorageMedium.Local
    ).then((value) => {
      /**
       * Remove stored sticky widget from implementation's localStorage if applicable
       */
      if (value === this.widget.name) {
        return createStorageWriter(
          this.container,
          STICKY_WIDGET_STORAGE_KEY,
          StorageCategory.Necessary,
          {
            medium: StorageMedium.Local,
            scope: StorageScope.Implementation,
          }
        )
          .then((write) => write())
          .then(() => Promise.all(promises));
      }
      return Promise.all(promises);
    });
  }
}
