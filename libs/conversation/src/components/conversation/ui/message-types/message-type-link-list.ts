import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  ConversationMessageListItemType,
  ConverstationMessageItem,
} from '../../../../types';

@customElement('message-type-link-list')
export class MessageTypeLinkList extends LitElement {
  static override styles = [
    css`
      :host {
        box-sizing: border-box;
      }
      * {
        box-sizing: border-box;
      }
      h1 {
        font-size: 1.1rem;
        margin: 0 0 var(--spacing-sm);
        font-weight: normal;
        line-height: 1.8rem;
        color: var(--text-color);
        white-space: normal;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .message-type-link-list button {
        color: var(--primary-color);
        background-color: transparent;
        max-width: 100%;
        border: none;
        cursor: pointer;
        text-transform: none;
        font-weight: 300;
        font-size: inherit;
        text-align: left;
        display: block;
        margin: 0;
        padding: 0;
      }
      .message-type-link-list ul {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }
    `,
  ];

  @property()
  message!: ConverstationMessageItem<ConversationMessageListItemType.LinkList>['1'];

  _onItemClick(item: any) {
    const event = new CustomEvent('action', {
      bubbles: true,
      composed: true,
      detail: {
        actionKey: 'action',
        payload: item,
      },
    });
    this.dispatchEvent(event);
  }

  override render() {
    return html`
      <div class="message-type-link-list">
        ${this.message.header ? html`<h1>${this.message.header}</h1>` : nothing}
        <ul>
          ${(this.message.actions as any[]).map(
            (item) => html`
              <li>
                <button @click=${() => this._onItemClick(item)}>
                  ${item.label}
                </button>
              </li>
            `
          )}
        </ul>
      </div>
    `;
  }
}
