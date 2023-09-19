import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BundledConversationMessage } from '../plugin';
import { ConversationMessageType } from '../../../conversation-controller';

@customElement('conversation-component-message')
export class Message extends LitElement {
  static override styles = css`
    :host {
      box-sizing: border-box;
      display: block;
    }
    * {
      box-sizing: border-box;
    }
    .message-content {
      padding: var(--spacing-md);
      display: inline-block;
      margin-top: var(--spacing-md);
      max-width: 100%;
      border: 1px solid var(--gray-color);
      border-radius: var(--border-radius);
      background-color: var(--bubble-bg-color);
      color: var(--bubble-text-color);
    }

    .conversation-user-message {
      --bubble-bg-color: var(--conversation-user-bg-color);
      --bubble-text-color: var(--conversation-user-text-color);
      margin-left: 10%;
      width: 90%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .conversation-agent-message {
      --bubble-bg-color: var(--conversation-agent-bg-color);
      --bubble-text-color: var(--conversation-agent-text-color);
      display: grid;
      margin-right: 10%;
      width: 90%;

      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto;
      grid-template-areas:
        'content'
        'info';
    }
    .conversation-agent-message.has-avatar {
      grid-template-columns: auto 1fr;
      grid-template-rows: 1fr auto;
      grid-template-areas:
        'avatar content'
        '. info';
    }

    .avatar {
      grid-area: avatar;
      place-self: flex-end;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--accent-color);
      align-self: flex-end;
      justify-self: center;
      overflow: hidden;
      margin-right: var(--spacing-md);
      justify-content: center;
      align-items: center;
    }
    .avatar img {
      height: 100%;
      width: 100%;
      object-fit: cover;
    }

    .conversation-timestamp {
      grid-area: info;
      margin: 0;
      line-height: 1.5em;
      grid-area: info;
      color: var(--text-color);
      font-size: 0.8rem;
      font-weight: 300;
    }

    .content-bundle {
      grid-area: content;
    }
  `;

  @property()
  message!: BundledConversationMessage;

  _renderTimestamp(name: string, timestamp: number | null) {
    if (!name && !timestamp) {
      return nothing;
    }

    const getTimestamp = (raw: number) => {
      return new Date(raw).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    let output = '';
    if (name) {
      if (timestamp) {
        output = `${name}: ${getTimestamp(timestamp)}`;
      } else {
        output = name;
      }
    } else if (timestamp) {
      output = getTimestamp(timestamp);
    }

    return html`<p class="conversation-timestamp">${output}</p>`;
  }

  override render() {
    switch (this.message.type) {
      case ConversationMessageType.System:
        return '';
      case ConversationMessageType.Agent:
        return html`<div
          class=${classMap({
            'conversation-agent-message': true,
            'has-avatar': !!this.message.sender?.avatar,
          })}
        >
          ${this.message.sender?.avatar
            ? html`<div class="avatar">
                <img src=${this.message.sender.avatar} />
              </div>`
            : nothing}

          <div class="content-bundle">
            ${this.message.content.map(
              (messageItems) => html`
                <div class="message-container">
                  <div class="message-content">
                    <conversation-component-message-list
                      .items=${messageItems.items || []}
                    ></conversation-component-message-list>
                  </div>
                </div>
              `
            )}
          </div>
          ${this._renderTimestamp(
            this.message.sender.name || '',
            this.message.timestamp
          )}
        </div>`;
      case ConversationMessageType.User:
        return html`<div class="conversation-user-message">
          <div class="content-bundle">
            ${this.message.content.map(
              (messageItems) => html`
                <div class="message-container">
                  <div class="message-content">
                    <conversation-component-message-list
                      .items=${messageItems.items || []}
                    ></conversation-component-message-list>
                  </div>
                </div>
              `
            )}
          </div>
          ${this._renderTimestamp(
            '', // TODO: properties.userLabel || ''
            this.message.timestamp
          )}
        </div>`;
      default:
        return nothing;
    }
  }
}
