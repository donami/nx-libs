import { LitElement, PropertyValueMap, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createRef, Ref, ref } from 'lit/directives/ref.js';
import { animate, fadeIn, fadeOut } from '@lit-labs/motion';

import { send, gridView } from '@teliads/icons';
import { classMap } from 'lit/directives/class-map.js';
// import { TeliaIcon } from '@teliads/components/dist/custom-elements';
import '@teliads/components/dist/components/telia-icon';

import { WidgetComponent } from '@telia-ace/widget-runtime-flamingo';
import { BundledConversationMessage } from './plugin';

import './ui/message';
import './ui/message-list';

/** Message types */
import './ui/message-types/message-type-html';
import './ui/message-types/message-type-link-list';
import './ui/message-types/message-type-separator';
import { scrollToBottomOfConversation } from './utils';

const WidgetElement = WidgetComponent(LitElement);

@customElement('ace-conversation')
export class ConversationComponent extends WidgetElement {
  static override styles = [
    WidgetElement.styles || [],
    css`
      :host {
        font-family: var(--font-family);
        --send-icon-color: var(--gray-dark-color, #a6a6a6);
        --conversation-bg: #fafafa;
        --conversation-agent-bg-color: var(--conversation-bg);
        --conversation-agent-text-color: var(-text-color);
        --conversation-user-bg-color: var(--primary-color);
        --conversation-user-text-color: white;

        scrollbar-width: thin; /* Firefox */
        scrollbar-color: #7f7f7f transparent; /* Firefox */
      }
      ::-webkit-scrollbar {
        width: 3px !important;
        background-color: transparent;
        border-left: none;
      }
      ::-webkit-scrollbar-thumb {
        background-color: #7f7f7f;
      }
      ::-webkit-scrollbar-track {
        -webkit-box-shadow: none !important;
        background-color: transparent;
      }

      .conversation {
        display: grid;
        grid-template-rows: 1fr auto;
        height: 100%;
        background-color: var(--conversation-bg);
      }

      .conversation.input-has-text {
        --send-icon-color: var(--primary-color);
      }

      .conversation-content {
        flex: 1;

        padding: var(--spacing-md);
        overflow-y: auto;
        overflow-x: hidden;
      }
      .conversation-content-inner {
        display: flex;
        flex-direction: column;
        justify-content: end;
        min-height: 100%;
      }
      .conversation-bottom {
        border-top: 1px solid var(--gray-color);
        background-color: #fff;
        min-height: 50px;
        max-height: 150px;
        display: flex;
        align-items: center;
        padding: 0 var(--spacing-md);
        margin: 0;
      }
      .conversation-bottom-left {
        border-right: 1px solid var(--gray-color);
        padding-right: var(--spacing-md);
      }
      .circle {
        background-color: var(--gray-dark-color, #a6a6a6);
        border-radius: 50%;
        color: #fff;
        padding: var(--spacing-sm, 5px);
        border: none;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .conversation-send-button {
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--send-icon-color);
      }
      input {
        border: none;
        font-family: inherit;
        font-size: inherit;
        flex: 1;
        padding: 0 var(--spacing-md);
        height: 2.5rem;
        outline: none;
      }

      @keyframes loaderanim {
        0% {
          opacity: 0;
        }
        75% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }

      .loader {
        display: flex;
        justify-content: center;
      }

      .loader > div {
        height: 10px;
        width: 10px;
        border-radius: 50%;
        margin: 5px;
        background-color: var(--text-color);
        animation-name: loaderanim;
        animation-duration: 1s;
        animation-iteration-count: infinite;
      }

      .loader > div:nth-of-type(2) {
        animation-delay: 100ms;
      }

      .loader > div:nth-of-type(3) {
        animation-delay: 200ms;
      }
    `,
  ];

  async _onClick(e: Event) {
    e.preventDefault();
    console.log('Todo', this.message); // TODO:
  }

  async _onSendMessage(e: Event) {
    e.preventDefault();
    await this.actions.dispatch('user-submit', { text: this.message });

    this.message = '';
  }

  _inputHandler(e: any) {
    this.message = e.target.value;
  }

  _actionHandler(
    e: CustomEvent<{ actionKey: string; payload: Record<string, any> | string }>
  ) {
    this.actions.dispatch(e.detail.actionKey, e.detail.payload);
  }

  @state()
  message = '';

  conversationContentRef: Ref<HTMLDivElement> = createRef();

  chatScrollHeight = 0;

  override updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    const scrollEl = this.conversationContentRef.value;
    if (scrollEl) {
      setTimeout(() => {
        const newScrollHeight = scrollEl.scrollHeight;

        if (newScrollHeight > this.chatScrollHeight) {
          scrollToBottomOfConversation(scrollEl);
          this.chatScrollHeight = newScrollHeight;
        }
      }, 1000);
    }
  }

  override render() {
    return html` <div
      @action=${this._actionHandler}
      class=${classMap({
        conversation: true,
        'input-has-text': this.message.length > 0,
      })}
    >
      <div class="conversation-content" ${ref(this.conversationContentRef)}>
        <div class="conversation-content-inner">
          ${(this.properties.messages || []).map(
            (message: BundledConversationMessage) =>
              html`<div class="conversation-entry" tabindex="-1">
                <conversation-component-message
                  .message=${message}
                  ${animate({
                    keyframeOptions: {},
                    in: fadeIn,
                    out: fadeOut,
                    stabilizeOut: true,
                    skipInitial: false,
                  })}
                >
                </conversation-component-message>
              </div>`
          )}
          ${this.properties.loading
            ? html`<div
                class="loader"
                ${animate({
                  in: fadeIn,
                  out: fadeOut,
                  skipInitial: false,
                })}
              >
                <div></div>
                <div></div>
                <div></div>
              </div>`
            : nothing}
        </div>
      </div>
      <form class="conversation-bottom" @submit=${this._onSendMessage}>
        <div class="conversation-bottom-left">
          <button class="circle" @click=${this._onClick} type="button">
            <telia-icon svg=${gridView.svg} size="sm"></telia-icon>
          </button>
        </div>
        <input
          placeholder="Type your message here..."
          .value=${this.message}
          @input=${this._inputHandler}
        />
        <div class="conversation-actions">
          <button class="conversation-send-button" type="submit">
            <telia-icon svg=${send.svg}></telia-icon>
          </button>
        </div>
      </form>
    </div>`;
  }
}

export default ConversationComponent;
