import {
  ReactiveController,
  ReactiveControllerHost,
  ReactiveElement,
} from 'lit';
import { Container } from '@webprovisions/platform';
import {
  ComponentDescriptor,
  ComponentPlatform,
  ComponentQuery,
} from '@telia-ace/widget-core-flamingo';
import { uuid } from '@telia-ace/widget-utilities';

export class ActionsController implements ReactiveController {
  host: ReactiveControllerHost;

  private _container?: Container;

  private _descriptor?: ComponentDescriptor;

  constructor(host: ReactiveElement) {
    (this.host = host).addController(this);
  }

  hostConnected() {}
  hostDisconnected() {}

  setDescriptor(descriptor: ComponentDescriptor) {
    this._descriptor = descriptor;
  }

  setContainer(container: Container) {
    this._container = container;
  }

  async dispatch(key: string, value: Record<string, any> | string) {
    if (!this._container || !this._descriptor) {
      return;
    }

    const componentPlatform = await ComponentPlatform.getInstance(
      this._container
    );

    const query = new ComponentQuery(componentPlatform).withId(
      this._descriptor.id
    );
    const actions = componentPlatform.actions(
      query,
      this._descriptor.type || uuid()
    );

    await actions.dispatch(key, value);
  }
}
