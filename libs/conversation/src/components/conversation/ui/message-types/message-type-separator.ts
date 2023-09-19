import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  ConversationMessageListItemType,
  ConverstationMessageItem,
} from '../../../../types';

@customElement('message-type-separator')
export class MessageTypeSeparator extends LitElement {
  static override styles = [
    css`
      :host {
        box-sizing: border-box;
      }
      * {
        box-sizing: border-box;
      }
      .message-type-separator {
        border-bottom: 1px solid var(--gray-color);
        width: 100%;
      }
    `,
  ];

  @property({ attribute: false })
  message!: ConverstationMessageItem<ConversationMessageListItemType.Separator>['1'];

  override render() {
    return html`<div class="message-type-separator"></div>`;
  }
}
