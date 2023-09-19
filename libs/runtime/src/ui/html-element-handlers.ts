const triggerTabHandler = (triggerDOMElement: HTMLElement) => {
  const toggleTabbing = (element: HTMLElement, tabbing: boolean) => {
    if (!element) {
      return;
    }

    if (tabbing) {
      element.classList.add('ace-tabbing');
    } else {
      element.classList.remove('ace-tabbing');
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      toggleTabbing(triggerDOMElement, true);
    } else if (
      !(
        e.key === 'Enter' &&
        document.activeElement &&
        document.activeElement.classList.contains('ace-widget-trigger')
      )
    ) {
      toggleTabbing(triggerDOMElement, false);
    }
  };

  const handleClick = (_e: MouseEvent) => {
    if (
      document.activeElement &&
      document.activeElement.classList.contains('ace-widget-trigger') &&
      document.activeElement.classList.contains('ace-tabbing')
    ) {
      return;
    }
    toggleTabbing(triggerDOMElement, false);
  };

  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleClick);

  return () => {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleClick);
  };
};

export type TriggerElementOptions = {
  symbol?: { type: string; content: string };
  widgetName: string;
  label?: string;
  ariaLabel?: string;
  tooltip?: string;
};

export function createTriggerElement(
  element: HTMLElement,
  options: TriggerElementOptions
) {
  const {
    // symbol,
    widgetName,
    label = '',
    ariaLabel = '',
    tooltip = '',
  } = options;

  element.classList.add('ace-widget-trigger');
  element.classList.add(`ace-widget_${widgetName}`);

  if (label.length) {
    element.classList.add('trigger-has-text');
  }

  if (ariaLabel.length && !element.getAttribute('aria-label')) {
    element.setAttribute('aria-label', ariaLabel);
  }

  if (ariaLabel.length && !element.getAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }

  if (tooltip.length && !element.getAttribute('title')) {
    element.setAttribute('title', tooltip);
  }

  return triggerTabHandler(element);
}

export function setInactive(
  elements: HTMLElement | HTMLElement[],
  title?: string
) {
  if (elements instanceof HTMLElement) {
    if (title) {
      elements.setAttribute('title', title);
    }
    elements.classList.remove('ace-trigger-active');
    elements.classList.remove('ace-trigger-loading');
  } else if (elements instanceof Array) {
    elements.forEach((e) => {
      if (title) {
        e.setAttribute('title', title);
      }
      e.classList.remove('ace-trigger-active');
      e.classList.remove('ace-trigger-loading');
    });
  }
}
export function setLoading(elements: HTMLElement | HTMLElement[]) {
  if (elements instanceof HTMLElement) {
    elements.classList.remove('ace-trigger-active');
    elements.classList.add('ace-trigger-loading');
  } else if (elements instanceof Array) {
    elements.forEach((e) => {
      e.classList.remove('ace-trigger-active');
      e.classList.add('ace-trigger-loading');
    });
  }
}
export function setActive(
  elements: HTMLElement | HTMLElement[],
  title?: string
) {
  if (elements instanceof HTMLElement) {
    if (title) {
      elements.setAttribute('title', title);
    }
    elements.classList.add('ace-trigger-active');
    elements.classList.remove('ace-trigger-loading');
  } else if (elements instanceof Array) {
    elements.forEach((e) => {
      if (title) {
        e.setAttribute('title', title);
      }
      e.classList.add('ace-trigger-active');
      e.classList.remove('ace-trigger-loading');
    });
  }
}
