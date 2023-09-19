import { WidgetComponent } from '@telia-ace/widget-runtime-flamingo';
import { LitElement, css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

const WidgetElement = WidgetComponent(LitElement);
@customElement('ace-list')
export class ListComponent extends WidgetElement {
  static override styles = [
    WidgetElement.styles || [],
    css`
      * {
        padding: 0;
        margin: 0;
      }
      .list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }
      ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }
    `,
  ];

  override render() {
    if (this.properties.loading) {
      return html`<p>Loading...</p>`;
    }

    return html` <div class="list">
      ${this.properties.header
        ? html`<h2>${this.properties.header}</h2>`
        : nothing}

      <ul>
        ${(this.properties.items || []).map((item: any) => {
          return html`<li>${item.title}</li>`;
        })}
      </ul>
    </div>`;
  }
}

export default ListComponent;
