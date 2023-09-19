import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ConverstationMessageItem } from '../../../types';

@customElement('conversation-component-message-list')
export class MessageList extends LitElement {
  static override styles = css`
    :host {
      box-sizing: border-box;
      display: block;
    }
    * {
      box-sizing: border-box;
    }
    .message-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }
  `;

  @property()
  items: ConverstationMessageItem<any>[] = [];

  private _isCustomComponent(type: string) {
    return !['html', 'link-list'].includes(type);
  }

  private _createCustomComponent(type: string, content: any) {
    // const elem = document.createElement(type);
    const customElem = customElements.get(type);
    if (customElem) {
      const elem = new customElem();
      (elem as any).message = content;
      return elem;
    }
    return nothing;
  }

  override render() {
    return html` <div class="message-list">
      ${this.items.map(
        ([type, content]) => html`
          ${type === 'html'
            ? html`
                <message-type-html .message=${content}> </message-type-html>
              `
            : nothing}
          ${type === 'link-list'
            ? html`
                <message-type-link-list .message=${content}>
                </message-type-link-list>
              `
            : nothing}
          ${type === 'separator'
            ? html`
                <message-type-separator .message=${content}>
                </message-type-separator>
              `
            : nothing}
          ${this._isCustomComponent(type)
            ? this._createCustomComponent(type, content)
            : nothing}
        `
      )}
    </div>`;
  }
}
