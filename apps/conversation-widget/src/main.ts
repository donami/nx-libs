// import './app/app.element';

import {
  GridWidget,
  GuideProviderPlugin,
} from '@telia-ace/widget-runtime-flamingo';
// import AreaComponent from '@telia-ace/widget-components-area-flamingo';
import WidgetHeaderComponent from '@telia-ace/widget-components-widget-header-flamingo';
import CopyrightComponent from '@telia-ace/widget-components-copyright-flamingo';
import ListComponent from '@telia-ace/widget-components-list-flamingo';
// import { findAndActivateStoredWidgets } from '@telia-ace/widget-utilities';

import { ConversationComponent } from '@telia-ace/widget-conversation-flamingo';
import { ConversationPlugin } from '@telia-ace/knowledge-widget-bot-provider-flamingo';

import { bootstrap, Environment } from '@telia-ace/widget-core';
// import packageJson from './package.json';

import config from './config.json';
import { KnowledgeDataClientPlugin } from '@telia-ace/knowledge-data-client-flamingo';
import { Widget } from '@webprovisions/platform';

(async () => {
  // const [, distributionName] = packageJson.name.split('/');
  const distributionName = 'uno-dist-from-wizard-pink';
  const widgetReq = await fetch(
    `https://widgets-service.webprovisions.io/widget/dist/${distributionName}`
  );
  const response = await widgetReq.json();
  const widgetConfiguration = {
    name: 'default',
    bindings: [],
    widgets: {
      'my-widget': {
        type: response.runtime,
        settings: config,
        // settings: JSON.parse(response.configuration),
      },
    },
  };

  const environment = ((window as any).webprovisions =
    Environment.createFromGlobal((window as any).webprovisions));
  (window as any).humany = (window as any).webprovisions;
  const implementation = environment.createImplementation(widgetConfiguration);

  // findAndActivateStoredWidgets(implementation);

  bootstrap(implementation, async (config) => {
    config.types.register('@telia-ace/widget-types-grid', GridWidget);
    const widget = implementation.widgets.get('my-widget') as Widget;

    config.plugin(ConversationPlugin);

    config.plugin(WidgetHeaderComponent);
    // config.plugin(AreaComponent);
    config.plugin(ListComponent);
    config.plugin(CopyrightComponent);
    config.plugin(ConversationComponent);
    config.plugin(KnowledgeDataClientPlugin);

    config.plugin(GuideProviderPlugin);

    await widget.activate();
    widget.invoke('attach', {
      withRenderState: 'open',
    });
  });
})();
