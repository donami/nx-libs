import { ContextProvider } from '@lit-labs/context';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, Ref, ref } from 'lit/directives/ref.js';
import {
  Container,
  EventSubscriptionCancellation,
} from '@webprovisions/platform';
import { ComponentPlatform, WidgetRenderState } from '@telia-ace/widget-core';

import { containerContext } from '../context/container.context';
import {
  getRenderState,
  subscribeToRenderState,
} from '../core/get-render-state';
import { getLayoutProps } from './get-layout-props';

@customElement('ace-widget-wrapper')
export class WrapperComponent extends LitElement {
  static override styles = css`
    :host {
      --font-family: TeliaSans, Helvetica, Arial, Lucida Grande, sans-serif;
      --spacing-xs: 0.2rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 1rem;
      --spacing-lg: 1.2rem;
      --spacing-xl: 1.8rem;

      --primary-color: #29003e;
      --secondary-color: #00558f;
      --text-color: #222222;
      --link-color: #990ae3;
      --gray-color: #efefef;
      --gray-dark-color: #a6a6a6;

      --box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
      --border-radius: 1rem;
      --border-radius-sm: 0.3rem;
    }
    :host {
      --voca-rem-multiplier: 0.625;
      box-sizing: border-box;
      display: block;
    }

    :host(.floating) {
      position: fixed;
      z-index: 6;
      inset: auto 20px 95px auto;
      max-height: calc(100vh - 120px);
    }
    :host(.floating) .widget-container {
      box-shadow: rgba(0, 0, 0, 0.16) 0px 5px 40px;
      border-radius: 0.7rem;
    }
    :host(.inline) {
      height: 100%;
      position: fixed;
      inset: 0 0 0 0;
    }

    * {
      box-sizing: border-box;
    }
    .widget-container {
      height: 100%;
    }
    .widget-container.expanded {
      opacity: 1;
      animation: slideUp 0.5s;
    }
    .widget-container.hidden {
      opacity: 0;
      animation: slideDown 0.5s;
    }
    @keyframes slideDown {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(100%);
        opacity: 0;
      }
    }
    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  // @provide({ context: containerContext })
  // container = this.container;
  private _provider = new ContextProvider(this, containerContext, undefined);

  @property({ attribute: false })
  container: Container | undefined;

  wrapperRef: Ref<HTMLDivElement> = createRef();

  private _unsubscribeRenderState?: EventSubscriptionCancellation;
  private _unsubscribePropChange?: EventSubscriptionCancellation;

  @state()
  componentPlatform: ComponentPlatform | undefined;

  @state()
  renderState?: WidgetRenderState;

  @state()
  breakpoints: string[] = [];

  @state()
  breakpointsSet = false;

  @state()
  entry: string | undefined;

  constructor() {
    super();
  }

  override connectedCallback() {
    super.connectedCallback();
    this._provider.setValue(this.container);

    if (this.container) {
      getRenderState(this.container).then((state) => {
        this.renderState = state;
      });

      subscribeToRenderState(this.container, (_origin, action) => {
        switch (action) {
          case 'close':
          case 'open':
            this.renderState =
              action === 'open'
                ? WidgetRenderState.open
                : WidgetRenderState.closed;
            break;
          case 'hide':
            this.renderState = WidgetRenderState.hidden;
        }
      }).then((unsubscribe) => {
        this._unsubscribeRenderState = unsubscribe;
      });

      ComponentPlatform.getInstance(this.container).then(
        (componentPlatform) => {
          this.componentPlatform = componentPlatform;

          this.breakpoints = this.componentPlatform.breakpoints;
          this.breakpointsSet = true;

          this._unsubscribePropChange = this.componentPlatform.events.subscribe(
            'components:properties-changed',
            (_event, data) => {
              if (data?.node?.type === 'root') {
                this.breakpoints = this.componentPlatform?.breakpoints
                  ? [...this.componentPlatform.breakpoints]
                  : [];
              }
            }
          );

          this.entry =
            this.componentPlatform.nodes.root.children.default[0].id ||
            undefined;
        }
      );
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this._unsubscribeRenderState) {
      this._unsubscribeRenderState();
    }
    if (this._unsubscribePropChange) {
      this._unsubscribePropChange();
    }
  }

  override render() {
    let layoutProps: ReturnType<typeof getLayoutProps> | undefined;

    if (!this.entry || !this.breakpointsSet) {
      return nothing;
    }

    if (this.container && this.renderState) {
      const [widgetDOMElement] = this.container.get('widgetDOMElements');

      if (widgetDOMElement) {
        widgetDOMElement.setAttribute('data-state', this.renderState);
      }
    }

    if (this.container) {
      const settings = this.container.get('$settings');

      if (settings?.layout) {
        layoutProps = getLayoutProps(
          settings.layout,
          this.breakpoints,
          !!settings.trigger
        );

        if (layoutProps.type === 'floating') {
          (this.renderRoot as any).host.classList.add('floating');
          (this.renderRoot as any).host.classList.remove('inline');
        } else {
          (this.renderRoot as any).host.classList.add('inline');
          (this.renderRoot as any).host.classList.remove('floating');
        }

        Object.entries(layoutProps.styles).forEach(([key, value]) => {
          (this.renderRoot as any).host.style.setProperty(key, value);
        });
      }
    }

    if (this.renderState) {
      if (this.renderState === WidgetRenderState.hidden) {
        this.wrapperRef.value?.classList.add('hidden');
        this.wrapperRef.value?.classList.remove('expanded');
      } else {
        this.wrapperRef.value?.classList.remove('hidden');
        this.wrapperRef.value?.classList.add('expanded');
      }
    }

    return html`
      <div class="widget-container" ${ref(this.wrapperRef)}>
        <ace-area entry=${this.entry}></ace-area>
      </div>
    `;
  }
}
