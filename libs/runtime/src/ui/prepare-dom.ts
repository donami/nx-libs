import { ViewOutletOptions } from './view-outlet';
import { TriggerComponent } from './trigger-component';
import { Container } from '@webprovisions/platform';

enum ProvidedElements {
  None = 'none',
  WidgetDOM = 'widgetDOM',
  TriggerDOM = 'triggerDOM',
  Both = 'both',
}

export enum TriggerType {
  Inline = 'inline',
  Link = 'link',
  Badge = 'badge',
  Unsupported = 'unsupported',
}

export const determineProvidedElements = (
  widgetDOMElement?: HTMLElement,
  triggerDOMElement?: HTMLElement
): ProvidedElements => {
  if (widgetDOMElement && triggerDOMElement) {
    return ProvidedElements.Both;
  }
  if (widgetDOMElement) {
    return ProvidedElements.WidgetDOM;
  }
  if (triggerDOMElement) {
    return ProvidedElements.TriggerDOM;
  }
  return ProvidedElements.None;
};

export const determineTriggerType = (triggerDefinition?: any) => {
  if (!triggerDefinition) {
    return TriggerType.Inline;
  }
  if (typeof triggerDefinition === 'boolean' && triggerDefinition) {
    return TriggerType.Link;
  }
  if (
    typeof triggerDefinition === 'object' &&
    !Array.isArray(triggerDefinition)
  ) {
    return TriggerType.Badge;
  }
  return TriggerType.Unsupported;
};

type PrepareDOMElementsOutput = ViewOutletOptions & {
  callback?: () => void;
};

export const prepareDOMElements = async (
  container: Container,
  name: string,
  providedWidgetElement?: HTMLElement,
  providedTriggerElement?: HTMLElement,
  triggerDefinition?: any,
  waitWithReplace: boolean = false
): Promise<PrepareDOMElementsOutput> => {
  const providedElements = determineProvidedElements(
    providedWidgetElement,
    providedTriggerElement
  );
  const triggerType = determineTriggerType(triggerDefinition);

  const cachedOriginals = {
    widgetDOMElement: providedWidgetElement
      ? providedWidgetElement.cloneNode(true)
      : undefined,
    triggerDOMElement: providedTriggerElement
      ? providedTriggerElement.cloneNode(true)
      : undefined,
  };

  const output: PrepareDOMElementsOutput = {
    triggerType,
    cachedOriginals,
    widgetDOMElement: document.createElement('div'),
  };

  switch (providedElements) {
    case ProvidedElements.Both: {
      output.widgetDOMElement =
        providedWidgetElement || document.createElement('div');
      if (triggerType !== TriggerType.Inline) {
        output.triggerDOMElement = providedTriggerElement;
      }
      break;
    }
    case ProvidedElements.WidgetDOM: {
      output.widgetDOMElement =
        providedWidgetElement || document.createElement('div');
      if (triggerType !== TriggerType.Inline) {
        const triggerElement = document.body.appendChild(
          document.createElement('a')
        );
        if (triggerType === TriggerType.Link) {
          triggerElement.innerText = name;
        }
        output.triggerDOMElement = triggerElement;
      }
      break;
    }
    case ProvidedElements.TriggerDOM: {
      const widgetElement = document.createElement('div');
      output.widgetDOMElement = widgetElement;
      if (triggerType === TriggerType.Inline) {
        // replace with widgetDOMElement in the DOM
        widgetElement.id = providedTriggerElement?.id || '';
        if (waitWithReplace) {
          widgetElement.style.display = 'none';
          providedTriggerElement?.parentNode?.appendChild(widgetElement);

          output.callback = () => {
            providedTriggerElement?.parentNode?.replaceChild(
              widgetElement,
              providedTriggerElement
            );
            widgetElement.style.display =
              providedTriggerElement?.style.display || 'block';
          };
        } else {
          providedTriggerElement?.parentNode?.replaceChild(
            widgetElement,
            providedTriggerElement
          );
        }
        output.cachedOriginals.widgetDOMElement = providedTriggerElement;
        output.cachedOriginals.triggerDOMElement = undefined;
      } else {
        output.widgetDOMElement = document.body.appendChild(widgetElement);
        output.triggerDOMElement = providedTriggerElement;
      }
      break;
    }
    case ProvidedElements.None: {
      const widgetElement = document.body.appendChild(
        document.createElement('div')
      );
      output.widgetDOMElement = widgetElement;
      if (triggerType !== TriggerType.Inline) {
        if (!customElements.get('ace-widget-trigger')) {
          customElements.define('ace-widget-trigger', TriggerComponent);
        }
        const trigger: any = document.createElement('ace-widget-trigger');
        trigger.symbol = triggerDefinition.symbol;
        trigger.container = container;

        document.body.appendChild(trigger);
        console.log('Created trigger');
        // if (triggerType === TriggerType.Link) {
        //   triggerElement.innerText = name;
        // }
        output.triggerDOMElement = trigger;
      }
      break;
    }
  }

  return output;
};
