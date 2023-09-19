import { Container } from '@webprovisions/platform';
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { mapBranding } from './branding';

type Symbol = {
  type: 'Uri' | 'Svg' | 'FontAwesome' | 'Text' | string;
  content: string;
};

// @customElement('ace-widget-trigger')
export class TriggerComponent extends LitElement {
  static override styles = [
    css`
      :host {
        --voca-rem-multiplier: 0.625;
        display: block;
        box-sizing: border-box;
      }

      .trigger {
        position: fixed;
        transform: scale(0);
        box-shadow: rgba(0, 0, 0, 0.16) 0px 5px 40px;
        bottom: 20px;
        right: 20px;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        line-height: 55px;
        height: 55px;
        width: 55px;
        border-radius: 55px;
        cursor: pointer;
        background-color: var(--trigger-bg, var(--primary-color));
        font-family: Lato;
        text-decoration: none;
        border: 3px dashed transparent;
        box-sizing: border-box;
        transition: transform 200ms ease-out;
      }
      .trigger:hover {
        transform: scale(1.1) !important;
      }
      .trigger.rendered {
        transform: scale(1);
      }
      .trigger.active .trigger-icon {
        opacity: 0;
        transform: rotate(-180deg) scale(0);
      }
      .trigger.active .trigger-close {
        opacity: 1;
        transform: rotate(0deg) scale(1);
      }

      .trigger-icon {
        display: inline-block;
        line-height: inherit;
        text-align: center;
        opacity: 1;
        transform: rotate(0deg) scale(1);
        transition:
          opacity 200ms ease-out,
          transform 200ms ease-out;
        color: var(--trigger-text-color, #fff);
      }
      .trigger-close {
        opacity: 0;
        transition: transform 200ms ease-out;
        transform: rotate(180deg) scale(0);
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        fill: var(--trigger-text-color, #fff);
      }
    `,
  ];

  @property({ attribute: false })
  symbol?: Symbol;

  @property({ attribute: false })
  container?: Container;

  @state()
  active: boolean = false;

  @state()
  loaded: boolean = false;

  @state()
  icon: any;

  override async connectedCallback() {
    super.connectedCallback();

    this.icon = await this._renderSymbol(this.symbol);
    this.loaded = true;

    this._applyBranding();
  }

  _toggleActive() {
    this.active = !this.active;
  }

  _applyBranding() {
    const settings = this.container?.get('$settings') ?? {};

    const root = settings?.components[settings?.entry];

    if (root) {
      mapBranding(root.context, this);
    }
  }

  async _renderSymbol(symbol?: Symbol) {
    const importIcon = async (iconName: string) => {
      const icon = await import('@teliads/icons').then((m) => {
        return m[iconName];
      });
      return icon;
    };

    if (symbol) {
      const { type, content } = symbol;
      switch (type) {
        case 'Telia': {
          const icon: any = await importIcon(content);
          if (icon) {
            return html`<telia-icon
              class="trigger-icon"
              svg=${icon.svg}
              size="lg"
            ></telia-icon>`;
          }
          return nothing;
        }
        case 'FontAwesome':
          return html`<i class="trigger-fa-icon fa fa-${content}"></i>`;
        case 'Uri':
          return html`<i
            class="trigger-custom-icon"
            style="background: url(${content}) no-repeat center center;background-size: contain;"
          ></i>`;
        default:
          return nothing;
      }
    }
  }

  override render() {
    return html`<button
      class=${classMap({
        trigger: true,
        active: this.active,
        rendered: this.loaded,
      })}
      @click=${this._toggleActive}
    >
      ${this.icon}
      <span class="trigger-close">
        <svg
          width="18"
          height="9"
          viewBox="0 0 18 9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 9C8.81794 9.00045 8.63759 8.96634 8.46939 8.89965C8.3012 8.83295 8.14851 8.735 8.02015 8.61145L0.194523 1.12367C0.068294 0.99862 -0.00155266 0.831133 2.61958e-05 0.657285C0.00160506 0.483436 0.0744832 0.317136 0.202964 0.194202C0.331445 0.0712675 0.505249 0.00153576 0.686941 2.50649e-05C0.868634 -0.00148563 1.04368 0.0653456 1.17437 0.186125L9 7.6739L16.8256 0.186125C16.9563 0.0653456 17.1314 -0.00148563 17.3131 2.50649e-05C17.4948 0.00153576 17.6686 0.0712675 17.797 0.194202C17.9255 0.317136 17.9984 0.483436 18 0.657285C18.0016 0.831133 17.9317 0.99862 17.8055 1.12367L9.97985 8.61145C9.85149 8.735 9.6988 8.83295 9.53061 8.89965C9.36241 8.96634 9.18206 9.00045 9 9Z"
            fill="white"
          />
        </svg>
      </span>
      <span class="trigger-loader">
        <svg viewBox="25 25 50 50">
          <circle
            cx="50"
            cy="50"
            r="20"
            fill="none"
            stroke="#000"
            stroke-width="2"
            stroke-miterlimit="10"
          />
        </svg>
      </span>
    </button>`;
  }
}
