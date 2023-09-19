import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { smileySad } from '@teliads/icons';

@customElement('ace-knowledge-bot-no-good-alternative')
export class NoGoodAlternative extends LitElement {
  static override styles = [
    css`
      :host {
        box-sizing: border-box;
      }
      * {
        box-sizing: border-box;
      }
      .no-good-alternative {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      button {
        background-color: transparent;
        padding: 0;
        margin: 0;
        border: none;
        cursor: pointer;
        font-family: inherit;
        color: inherit;
        font-size: inherit;
        text-transform: none;
        overflow: visible;
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
      }
    `,
  ];

  @property()
  message!: { body: string };

  private _handleClick() {
    const event = new CustomEvent('action', {
      bubbles: true,
      composed: true,
      detail: {
        actionKey: 'action',
        payload: 'help',
      },
    });
    this.dispatchEvent(event);
  }

  override render() {
    return html`<div class="no-good-alternative">
      <button @click=${this._handleClick} aria-label=${this.message.body}>
        <telia-icon svg=${smileySad.svg} size="sm"></telia-icon>

        <span>${this.message.body}</span>
      </button>
    </div>`;
  }
}

export default NoGoodAlternative;
