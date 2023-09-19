import { LitElement, css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { WidgetComponent } from '@telia-ace/widget-runtime-flamingo';

const WidgetElement = WidgetComponent(LitElement);

@customElement('ace-widget-header')
export class WidgetHeaderComponent extends WidgetElement {
  static override styles = [
    WidgetElement.styles || [],
    css`
      .widget-header {
        background-color: var(--primary-color);
        color: #fff;
        height: 85px;
        display: flex;
        flex-direction: row;
        align-items: center;
        border-radius: var(--spacing-sm) var(--spacing-sm) 0px 0px;
        padding: 0 var(--spacing-md);
      }

      h1 {
        font-size: 1.2rem;
      }

      h1,
      p {
        margin: 0;
        padding: 0;
      }
    `,
  ];

  override render() {
    return html` <div class="widget-header">
      <div>
        <h1>${this.properties.header}</h1>

        ${this.properties.tagline
          ? html`<p>${this.properties.tagline}</p>`
          : nothing}
      </div>
    </div>`;
  }
}

export default WidgetHeaderComponent;
