import { LitElement, css } from 'lit';
import { childrenContext } from '../context/children.context';
import { propertiesCtx } from '../context/properties.context';
import { contextCtx } from '../context/context.context';
import { layoutCtx } from '../context/layout.context';
import { ContextProvider, consume } from '@lit-labs/context';
import {
  Container,
  EventSubscriptionCancellation,
} from '@webprovisions/platform';
import { containerContext } from '../context/container.context';
import { property, state } from 'lit/decorators.js';
import {
  ComponentDescriptor,
  ComponentPlatform,
  ComponentResolver,
  asDescriptor,
} from '@telia-ace/widget-core-flamingo';
import { descriptorContext } from '../context/component-node.context';
import { ActionsController } from '../controllers/actions-controller';
import { mapBranding } from '../ui/branding';
import { appendStyleFromProperties } from '../ui/get-css-props';

type Constructor<T = {}> = new (...args: any[]) => T;

export declare class WidgetComponentInterface {
  entry: string;
  descriptor?: ComponentDescriptor;
  component?: any;
  layout: Record<string, any>;
  context: Record<string, any>;
  properties: Record<string, any>;
  container?: Container;
  actions: ActionsController;
  _contextProvider: ContextProvider<typeof contextCtx>;
  _propertiesProvider: ContextProvider<typeof propertiesCtx>;
  _childrenProvider: ContextProvider<typeof childrenContext>;
}

export const WidgetComponent = <T extends Constructor<LitElement>>(
  superClass: T
) => {
  class WidgetComponentClass extends superClass {
    static styles = [
      (superClass as unknown as typeof LitElement).styles ?? [],
      css`
        :host {
          font-family: var(--font-family);
          grid-column: span var(--width);
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
          display: block;
        }
        * {
          box-sizing: border-box;
        }
      `,
    ];

    @consume({ context: containerContext })
    @property({ attribute: false })
    public container?: Container;

    @property()
    entry: string = '';

    private _descriptorProvider = new ContextProvider(
      this,
      descriptorContext,
      undefined
    );
    _childrenProvider = new ContextProvider(this, childrenContext, []);
    _propertiesProvider = new ContextProvider(this, propertiesCtx, {});
    _contextProvider = new ContextProvider(this, contextCtx, {});
    private _layoutProvider = new ContextProvider(this, layoutCtx, {});

    private _propertyChangeListener?: EventSubscriptionCancellation;
    private _contextChangeListener?: EventSubscriptionCancellation;
    private _layoutChangeListener?: EventSubscriptionCancellation;
    private _unmountNode?: any;

    actions = new ActionsController(this);

    @state()
    descriptor?: ComponentDescriptor;

    @state()
    component?: any;

    @state()
    context: Record<string, any> = {};

    @state()
    layout: Record<string, any> = {};

    @state()
    properties: Record<string, any> = {};

    override connectedCallback() {
      super.connectedCallback();

      if (this.container) {
        this.actions.setContainer(this.container);
        ComponentPlatform.getInstance(this.container).then(
          async (componentPlatform) => {
            const componentNode = componentPlatform.nodes.get(this.entry);
            if (componentNode) {
              this._propertyChangeListener = componentPlatform.events.subscribe(
                'components:properties-changed',
                (_event, data) => {
                  if (
                    componentNode.id === data.node.id /*&& isMounted.current*/
                  ) {
                    this._setProperties(data.node.attributes.properties);
                  }
                }
              );
              this._contextChangeListener = componentPlatform.events.subscribe(
                'components:context-changed',
                (_event, data) => {
                  if (
                    componentNode.id === data.node.id /*&& isMounted.current*/
                  ) {
                    this._setContext(data.node.attributes.context);
                  }
                }
              );
              this._layoutChangeListener = componentPlatform.events.subscribe(
                'components:layout-changed',
                (_event, data) => {
                  if (
                    componentNode.id === data.node.id /*&& isMounted.current*/
                  ) {
                    this._setLayout(data.node.attributes.layout);
                  }
                }
              );

              const branch = 'default'; // TODO:

              this._unmountNode = componentNode.mount(this.container!);

              this._setDescriptor(asDescriptor(componentNode, branch));
              this._setProperties(componentNode.attributes.properties);
              this._setContext(componentNode.attributes.context);
              this._setLayout(this.layout);

              const children = componentNode
                .getChildren(branch)
                .map((child) => asDescriptor(child));

              this._childrenProvider.setValue(children);

              const resolver: ComponentResolver =
                await this.container!.getAsync('componentResolver');

              const componentResolver = resolver.getComponent(
                this.descriptor?.type || ''
              );
              if (componentResolver.then) {
                componentResolver.then((componentModule: any) => {
                  this.component = componentModule.default;
                });
              }
            }
          }
        );
      }
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();

      if (this._propertyChangeListener) {
        this._propertyChangeListener();
      }
      if (this._contextChangeListener) {
        this._contextChangeListener();
      }
      if (this._layoutChangeListener) {
        this._layoutChangeListener();
      }

      if (this._unmountNode) {
        this._unmountNode();
      }
    }

    override updated() {
      if (this.container) {
        this.actions.setContainer(this.container);
      }
      mapBranding(this.context, (this.renderRoot as any).host);

      (this.renderRoot as any).host.style.setProperty(
        '--width',
        this.layout.size === 'full'
          ? 'var(--columns, 1)'
          : `min(${this.layout.size || 'var(--columns)'}, var(--columns))`
      );

      appendStyleFromProperties((this.renderRoot as any).host, this.properties);
    }

    private _setProperties(value: Record<string, any>) {
      this._propertiesProvider.setValue(value);
      this.properties = value;
    }
    private _setContext(value: Record<string, any>) {
      this._contextProvider.setValue(value);
      this.context = value;
    }
    private _setLayout(value: Record<string, any>) {
      this._layoutProvider.setValue(value);
      this.layout = value;
    }
    private _setDescriptor(value: ComponentDescriptor) {
      this.descriptor = value;
      this._descriptorProvider.setValue(value);
      this.actions.setDescriptor(value);
    }
  }
  // Cast return type to your mixin's interface intersected with the superClass type
  return WidgetComponentClass as Constructor<WidgetComponentInterface> & T;
};
