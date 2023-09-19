import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  ConversationMessageListItemType,
  ConverstationMessageItem,
} from '../../../../types';

@customElement('message-type-html')
export class MessageTypeHtml extends LitElement {
  static override styles = [
    css`
      :host {
        box-sizing: border-box;
      }
      * {
        box-sizing: border-box;
      }
      p {
        margin: 0;
        padding: 0;
        word-break: break-word;
      }
    `,
  ];

  @property()
  message!: ConverstationMessageItem<ConversationMessageListItemType.HTML>['1'];

  override render() {
    return html`<div class="message-type-html">
      ${unsafeHTML(this.message.body)}
    </div>`;
  }
}
