import { smileyHappy, smileySad } from '@teliads/icons';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ace-knowledge-bot-feedback-list')
export class FeedbackList extends LitElement {
  static override styles = [
    css`
      :host {
        box-sizing: border-box;
      }
      * {
        box-sizing: border-box;
      }
      .feedback-list {
        display: flex;
        gap: var(--spacing-sm);
        flex-direction: column;
      }
      button {
        background-color: transparent;
        padding: var(--spacing-sm);
        margin: 0;
        border: 1px solid var(--primary-color);
        font-weight: 300;
        cursor: pointer;
        font-family: inherit;
        font-size: inherit;
        color: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
          background-color 200ms ease-out 0s,
          color 200ms ease-out 0s;
        border-radius: var(--border-radius-sm);
        gap: var(--spacing-xs);
      }

      button:hover {
        background-color: var(--primary-color);
        color: #fff;
      }
    `,
  ];

  @property()
  message!: { actions: { actionKey: string; label: string }[] };

  private _handleClick(action: { actionKey: string; label: string }) {
    const event = new CustomEvent('action', {
      bubbles: true,
      composed: true,
      detail: {
        actionKey: 'action',
        payload: action.actionKey,
      },
    });
    this.dispatchEvent(event);
  }

  override render() {
    return html`<div class="feedback-list">
      ${this.message.actions.map(
        (action) => html`
          <button @click=${() => this._handleClick(action)} aria-label=${
            action.label
          }>
          ${
            action.actionKey === 'yes'
              ? html`<telia-icon svg=${smileyHappy.svg} size="sm"></telia-icon>`
              : html`<telia-icon svg=${smileySad.svg} size="sm"></telia-icon>`
          }
          
            <span>${action.label}<span>
          </button>
        `
      )}
    </div>`;
  }
}

export default FeedbackList;
