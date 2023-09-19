import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { mapBranding } from './branding';
import { appendStyleFromProperties } from './get-css-props';
import { ComponentDescriptor, ComponentResolver } from '@telia-ace/widget-core-flamingo';
import { WidgetComponent } from '../mixins/widget-component.mixin';

const WidgetElement = WidgetComponent(LitElement);

@customElement('ace-area')
export class AreaComponent extends WidgetElement {
  static override styles = [
    WidgetElement.styles || [],
    css`
      :host {
        height: 100%;
        display: grid;
        justify-content: center;
        grid-auto-rows: max-content;
        grid-template-rows: auto;
        grid-template-columns: repeat(var(--columns), 1fr);
      }
    `,
  ];

  private _resolveChildComponent = async (type: string) => {
    const resolver: ComponentResolver =
      await this.container!.getAsync('componentResolver');

    const componentResolver = resolver.getComponent(type);
    if (componentResolver.then) {
      return componentResolver.then((componentModule: any) => {
        return componentModule.default;
      });
    }
  };

  private _resolveAllChildren = async (children: ComponentDescriptor[]) => {
    return Promise.all(
      children.map(async (child) => {
        let component: any = customElements.get(`ace-${child.type}`);

        if (!component) {
          component = await this._resolveChildComponent(child.type || '');
        }

        return {
          ...child,
          component,
        };
      })
    );
  };

  override render() {
    mapBranding(this.context, (this.renderRoot as any).host);

    (this.renderRoot as any).host.style.setProperty(
      '--width',
      this.layout.size === 'full'
        ? 'var(--columns, 1)'
        : `min(${this.layout.size || 'var(--columns)'}, var(--columns))`
    );

    (this.renderRoot as any).host.style.setProperty(
      '--columns',
      this._propertiesProvider.value.columns?.toString() || '1'
    );

    appendStyleFromProperties(
      (this.renderRoot as any).host,
      this._propertiesProvider.value
    );

    return html`
      ${until(
        this._resolveAllChildren(this._childrenProvider.value).then(
          (children) => {
            return html`
              ${children.map((child) => {
                if (child.type === 'area') {
                  return html`<ace-area entry=${child.id}></ace-area>`;
                }

                const instance = new child.component();
                instance.entry = child.id;
                return instance;
              })}
            `;
          }
        )
      )}
    `;
  }
}
