import { readStorage, StorageMedium } from '@telia-ace/widget-services';
import { notifyDataLoaded } from '@telia-ace/widget-utilities';
import { Container, Widget } from '@webprovisions/platform';
import {
  createTriggerElement,
  setActive,
  setLoading,
} from './html-element-handlers';
import { TriggerType } from './prepare-dom';

const MODALS_STORAGE_KEY = 'modals';

type SymbolType = {
  type: 'Uri' | 'Svg' | 'FontAwesome' | 'Text' | string;
  content: string;
};

export type BadgeOptions = {
  symbol?: SymbolType;
  label?: string;
  ariaLabel?: string;
  openTooltip?: string;
  closedTooltip?: string;
};

export type ViewOutletOptions = {
  widgetDOMElement: HTMLElement;
  triggerDOMElement?: HTMLElement;
  triggerOptions?: BadgeOptions | boolean;
  triggerType: TriggerType;
  cachedOriginals: {
    widgetDOMElement?: Node;
    triggerDOMElement?: Node;
  };
};

type Modals = {
  name: string;
  ref?: HTMLElement;
  selector?: string;
};

export class ViewOutlet {
  container: Container;
  private unsubscribe: (() => void)[] = [];

  constructor(container: Container, public options: ViewOutletOptions) {
    this.container = container.createChild(this);
    this.container.register('widgetDOMElement', this.options.widgetDOMElement);
    this.container.register(
      'triggerDOMElement',
      this.options.triggerDOMElement
    );

    const widget: Widget = this.container.get('$widget');
    this.options.widgetDOMElement.classList.add('ace-widget');
    this.options.widgetDOMElement.classList.add(`ace-widget_${widget.name}`);

    const widgetDOMElements = container.get('widgetDOMElements') || [];
    container.register('widgetDOMElements', [
      ...widgetDOMElements,
      this.options.widgetDOMElement,
    ]);
  }

  /**
   * Renders the view outlet to the DOM.
   */
  render() {
    const { widgetDOMElement, triggerDOMElement } = this.options;

    const widget: Widget = this.container.get('$widget');

    if (widgetDOMElement.getAttribute('data-rendered') === 'true') {
      return Promise.resolve();
    }

    if (triggerDOMElement && this.options.triggerType === TriggerType.Badge) {
      setLoading(triggerDOMElement);
    }

    return import('./render')
      .then((module) => module.default(this.container, widgetDOMElement))
      .then(() => {
        widgetDOMElement.setAttribute('data-rendered', 'true');

        if (
          triggerDOMElement &&
          this.options.triggerType === TriggerType.Badge
        ) {
          const tooltip = (this.options.triggerOptions as BadgeOptions)
            .openTooltip;
          setActive(triggerDOMElement, tooltip);
        }
        notifyDataLoaded(this.container, widgetDOMElement);

        const widgets = this.container.get('$environment').widgets.all();

        readStorage<Modals[]>(
          this.container,
          MODALS_STORAGE_KEY,
          StorageMedium.Session
        ).then((modals: any) => {
          if (modals) {
            modals.forEach((modal: any) => {
              if (
                widgets.find(
                  (w: Widget) =>
                    w.name === modal.name && w.state === 'activated'
                )
              ) {
                widget.events.dispatch('widget:modal-opened', modal);
              }
            });
          }
        });
      });
  }

  renderBadge(options: BadgeOptions) {
    const { triggerDOMElement } = this.options;

    if (!triggerDOMElement) {
      return;
    }

    if (!triggerDOMElement.getAttribute('role')) {
      triggerDOMElement.setAttribute('role', 'button');
    }

    const { name }: Widget = this.container.get('$widget');

    const { label, symbol, ariaLabel, closedTooltip, openTooltip } = options;

    const triggerOptions = { closedTooltip, openTooltip };
    this.options.triggerOptions = triggerOptions;

    const removeTriggerListeners = createTriggerElement(triggerDOMElement, {
      label,
      symbol,
      ariaLabel,
      widgetName: name,
      tooltip: closedTooltip,
    });
    this.unsubscribe.push(removeTriggerListeners);
  }

  async dispose() {
    const { triggerDOMElement, widgetDOMElement } = this.options;
    if (this.options.cachedOriginals.widgetDOMElement) {
      if (widgetDOMElement) {
        widgetDOMElement.parentNode?.replaceChild(
          this.options.cachedOriginals.widgetDOMElement,
          widgetDOMElement
        );
      }
    }
    if (this.options.cachedOriginals.triggerDOMElement) {
      if (triggerDOMElement) {
        triggerDOMElement.parentNode?.replaceChild(
          this.options.cachedOriginals.triggerDOMElement,
          triggerDOMElement
        );
      }
    }
    this.unsubscribe.forEach((unsubscribe) => {
      unsubscribe();
    });
    widgetDOMElement.parentNode?.removeChild(widgetDOMElement);
    triggerDOMElement?.parentNode?.removeChild(triggerDOMElement);
  }
}
