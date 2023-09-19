import { WidgetComponent } from '@telia-ace/widget-runtime-flamingo';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

const WidgetElement = WidgetComponent(LitElement);

@customElement('ace-copyright')
export class CopyrightComponent extends WidgetElement {
  static override styles = [
    WidgetElement.styles || [],
    css`
      .copyright {
        padding: var(--spacing-md);
        box-shadow: 1px 0px 10px rgba(0, 0, 0, 0.1);
        z-index: 6;
        background-color: #fff;
      }

      a {
        display: flex;
        justify-content: center;
        align-items: center;
        outline: none;
      }

      svg {
        width: 145px;
      }

      svg.compact {
        width: 130px;
      }
    `,
  ];

  override render() {
    /**
     *      class=${classMap({
            compact: this.properties.mode === 'compact',
          })}
     */
    return html` <div class="copyright">
      <a
        aria-label="Powered by Telia ACE"
        href="https://ace-showcase.com/marketplace/ace-knowledge/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xlink:href="http://www.w3.org/1999/xlink"
          viewBox="0 0 1000 150"
          class="compact"
        >
          <g>
            <path
              d="M107.5,47.9c5.3,0,9.3,1.4,12,4.1s4.1,6.5,4.1,11.4c0,4.9-1.4,8.7-4.1,11.5c-2.7,2.7-6.7,4.1-12,4h-16v21.5h-7V47.9H107.5z
              M105.2,73.1c4,0,6.9-0.8,8.7-2.4c1.8-1.7,2.8-4.1,2.8-7.2c0-3.1-0.9-5.5-2.8-7.2c-1.8-1.6-4.7-2.5-8.7-2.5H91.5v19.3H105.2z"
            />
            <path
              d="M130.8,63.9c1.1-3.3,2.6-6.2,4.7-8.8c2.1-2.5,4.7-4.6,7.9-6.1c3.1-1.5,6.8-2.3,11-2.3c4.2,0,7.8,0.8,11,2.3
              c3.1,1.5,5.8,3.6,7.9,6.1c2.1,2.6,3.7,5.5,4.7,8.8c1.1,3.3,1.6,6.8,1.6,10.3c0,3.6-0.5,7-1.6,10.3c-1.1,3.3-2.6,6.2-4.7,8.8
              c-2.1,2.6-4.7,4.6-7.9,6.1c-3.1,1.5-6.8,2.2-11,2.2c-4.2,0-7.8-0.7-11-2.2c-3.1-1.5-5.8-3.5-7.9-6.1c-2.1-2.5-3.7-5.5-4.7-8.8
              c-1.1-3.3-1.6-6.8-1.6-10.3C129.2,70.6,129.8,67.2,130.8,63.9z M137.2,82c0.7,2.6,1.8,4.9,3.2,7c1.5,2.1,3.4,3.7,5.7,5
              c2.3,1.3,5.1,1.9,8.2,1.9c3.2,0,5.9-0.6,8.2-1.9c2.3-1.2,4.2-2.9,5.7-5c1.5-2.1,2.5-4.4,3.2-7c0.7-2.6,1-5.2,1-7.8s-0.3-5.3-1-7.8
              c-0.7-2.6-1.8-4.9-3.2-7s-3.4-3.7-5.7-5c-2.3-1.3-5.1-1.9-8.2-1.9c-3.2,0-5.9,0.6-8.2,1.9c-2.3,1.3-4.2,2.9-5.7,5s-2.6,4.4-3.2,7
              c-0.7,2.6-1,5.2-1,7.8S136.6,79.5,137.2,82z"
            />
            <path
              d="M228.2,100.5l-12-44.1h-0.1L204,100.5h-7.3l-13.5-52.5h7.1l10.3,43.7h0.1l11.8-43.7h7.6l11.6,43.7h0.1l10.7-43.7h7
              l-14,52.5H228.2z"
            />
            <path
              d="M292.5,47.9v5.9h-29.3v16.7h27.3v5.9h-27.3v18.2h29.5v5.9h-36.5V47.9H292.5z"
            />
            <path
              d="M325.8,47.9c5,0,8.9,1.2,11.7,3.7c2.8,2.5,4.2,5.8,4.2,10.1c0,3.2-0.7,6-2.2,8.4c-1.4,2.4-3.8,4-7,4.9v0.1
              c1.5,0.3,2.8,0.8,3.7,1.5c1,0.7,1.7,1.5,2.3,2.5c0.6,1,1,2,1.3,3.2c0.3,1.2,0.5,2.4,0.6,3.7c0.1,1.3,0.2,2.6,0.2,3.9
              c0,1.3,0.2,2.6,0.4,3.9c0.2,1.3,0.5,2.5,0.8,3.6c0.4,1.2,0.9,2.2,1.7,3.1h-7.8c-0.5-0.5-0.8-1.3-1-2.2c-0.2-0.9-0.3-2-0.3-3.1
              c0-1.2-0.1-2.4-0.1-3.7c0-1.3-0.2-2.6-0.4-3.9c-0.2-1.3-0.4-2.5-0.7-3.6c-0.3-1.2-0.8-2.2-1.4-3c-0.6-0.9-1.5-1.5-2.5-2.1
              c-1-0.5-2.4-0.8-4.1-0.8h-17.1v22.4h-7V47.9H325.8z M327.3,71.8c1.5-0.2,2.8-0.7,3.9-1.4c1.1-0.7,2-1.7,2.6-2.9
              c0.7-1.2,1-2.8,1-4.7c0-2.6-0.7-4.8-2.2-6.5c-1.5-1.7-3.9-2.5-7.1-2.5h-17.4v18.3h14.6C324.3,72.2,325.8,72,327.3,71.8z"
            />
            <path
              d="M387.8,47.9v5.9h-29.3v16.7h27.3v5.9h-27.3v18.2H388v5.9h-36.5V47.9H387.8z"
            />
            <path
              d="M414.5,47.9c8.1,0,14.3,2.1,18.7,6.2c4.4,4.1,6.5,10.4,6.5,18.8c0,4.4-0.5,8.3-1.5,11.7c-1,3.4-2.5,6.3-4.6,8.6
              s-4.7,4.1-7.9,5.3c-3.2,1.2-7,1.8-11.3,1.8h-18V47.9H414.5z M415.1,94.6c0.8,0,1.8-0.1,2.9-0.2c1.2-0.1,2.4-0.4,3.8-0.9
              c1.3-0.5,2.6-1.1,3.9-2c1.3-0.9,2.5-2.1,3.5-3.6c1-1.5,1.9-3.4,2.5-5.7c0.7-2.3,1-5,1-8.3c0-3.1-0.3-5.9-0.9-8.4
              c-0.6-2.5-1.6-4.6-3-6.3c-1.4-1.7-3.2-3.1-5.4-4c-2.2-0.9-4.9-1.4-8.2-1.4h-11.8v40.8H415.1z"
            />
            <path
              d="M487.8,47.9c1.1,0,2.3,0,3.6,0c1.3,0,2.6,0.1,3.9,0.2c1.3,0.1,2.5,0.3,3.6,0.6c1.1,0.2,2,0.6,2.8,1.1
              c1.7,1,3.2,2.5,4.4,4.3c1.2,1.8,1.8,4,1.8,6.7c0,2.8-0.7,5.2-2,7.2c-1.3,2-3.3,3.5-5.8,4.5v0.1c3.2,0.7,5.7,2.2,7.4,4.4
              c1.7,2.3,2.6,5,2.6,8.2c0,1.9-0.3,3.8-1,5.6c-0.7,1.8-1.7,3.4-3.1,4.8c-1.3,1.4-3,2.5-5,3.4c-2,0.9-4.3,1.3-6.9,1.3h-25.4V47.9
              H487.8z M489.7,70.5c4,0,6.8-0.7,8.6-2.1c1.7-1.4,2.6-3.5,2.6-6.3c0-1.9-0.3-3.3-0.9-4.4c-0.6-1.1-1.4-1.9-2.4-2.5
              c-1-0.6-2.2-1-3.6-1.1c-1.3-0.2-2.8-0.3-4.3-0.3h-14v16.7H489.7z M493.2,94.6c3.1,0,5.5-0.8,7.2-2.5c1.7-1.7,2.6-4,2.6-6.9
              c0-1.7-0.3-3.1-1-4.3c-0.6-1.1-1.5-2-2.5-2.7c-1.1-0.7-2.3-1.1-3.6-1.4c-1.4-0.3-2.8-0.4-4.3-0.4h-16v18.2H493.2z"
            />
            <path
              d="M540.8,100.5h-7V79l-20.3-31h8.3l15.7,25l15.4-25h7.9l-20.1,31V100.5z"
            />
          </g>
          <g>
            <path
              fill="#9924DF"
              d="M597.5,59.6h-10.1c-2.6,0-5.1-4.5-5.1-5.9c0-2.4,3.8-4.8,7.4-4.8h30.1c1.9,0,2.9,0.9,2.9,2.6c0,4-2.6,8-5.1,8
              h-9.8v33.2c0,4-2.6,8-5.2,8c-2.6,0-5.1-4.5-5.1-5.9V59.6z"
            />
            <path
              fill="#9924DF"
              d="M633.6,100.5c-2.6,0-5.1-4.5-5.1-5.9V53.8c0-2.4,3.8-4.8,7.4-4.8h24.2c1.8,0,2.7,0.9,2.7,2.6
              c0,2.6-1.2,5.3-2.6,6.7c-0.8,0.7-1.5,1-2.3,1h-19.1v10.4h18c1.7,0,2.6,0.8,2.6,2.4c0,3.6-2.3,7.1-4.6,7.1h-16v11h22
              c1.8,0,2.7,0.9,2.7,2.6c0,2.6-1.2,5.3-2.6,6.7c-0.8,0.7-1.5,1-2.3,1H633.6z"
            />
            <path
              fill="#9924DF"
              d="M675.6,100.5c-2.6,0-5.1-4.5-5.1-5.9V53.3c0-2.4,3.8-4.8,7.4-4.8c1.9,0,2.9,0.9,2.9,2.6v39h19.1
              c1.8,0,2.7,0.9,2.7,2.6c0,2.6-1.2,5.3-2.6,6.7c-0.8,0.7-1.5,1-2.3,1H675.6z"
            />
            <path
              fill="#9924DF"
              d="M708.4,53.3c0-2.4,3.8-4.8,7.4-4.8c1.9,0,2.9,0.9,2.9,2.6v41.7c0,4-2.6,8-5.2,8c-2.6,0-5.1-4.5-5.1-5.9V53.3z"
            />
            <path
              fill="#9924DF"
              d="M756.9,90.2h-21l-2.2,6.3c-0.9,2.6-2.7,4.4-4.5,4.4c-2.6,0-5.1-4.5-5.1-5.9c0-0.3,0.1-0.7,0.3-1.3l15.1-40.9
              c0.5-1.4,2.1-2.6,4.2-3.3c1-0.4,2-0.5,2.9-0.5h4.6c1.5,0,2.4,0.5,2.7,1.6l14.7,40.8c0.2,0.4,0.3,1,0.3,1.5c0,4-2.6,8-5.1,8
              c-1.3,0-2.6-1-3.8-2.9c-0.5-0.7-0.9-1.5-1.1-2.1L756.9,90.2z M753.9,81.4l-7.4-21.3L739,81.4H753.9z"
            />
            <path
              fill="#9924DF"
              d="M820.5,90.2h-21l-2.2,6.3c-0.9,2.6-2.7,4.4-4.5,4.4c-2.6,0-5.1-4.5-5.1-5.9c0-0.3,0.1-0.7,0.3-1.3L803,52.8
              c0.5-1.4,2.1-2.6,4.2-3.3c1-0.4,2-0.5,2.9-0.5h4.6c1.5,0,2.4,0.5,2.7,1.6l14.7,40.8c0.2,0.4,0.3,1,0.3,1.5c0,4-2.6,8-5.1,8
              c-1.2,0-2.6-1-3.8-2.9c-0.5-0.7-0.9-1.5-1.1-2.1L820.5,90.2z M817.4,81.4l-7.4-21.3l-7.5,21.3H817.4z"
            />
            <path
              fill="#9924DF"
              d="M860.4,101.6c-9.6,0-17.8-5.4-22.1-13.4c-2.1-4-3.2-8.3-3.2-12.9c0-10.2,5.5-19.1,13.7-23.8
              c4-2.4,8.5-3.5,13.1-3.5c5.1,0,9.7,1.3,13.8,3.8c0.7,0.4,1.1,1.2,1.1,2.2c0,3.6-2.4,7.4-4.6,7.4c-0.5,0-1.1-0.1-1.8-0.5
              c-3-1.5-5.9-2.3-8.7-2.3c-6.2,0-11.3,3.2-13.8,8.1c-1.3,2.5-2,5.2-2,8.2c0,6.3,3,11.5,7.7,14.1c2.3,1.4,4.9,2.1,7.7,2.1
              c3.2,0,6.4-0.7,9.6-2.1c1.7-0.7,3-1.1,4-1.1c1.8,0,2.6,0.9,2.6,2.6c0,2.6-1.2,5.3-2.9,6.8C871.4,99.7,865.6,101.6,860.4,101.6z"
            />
            <path
              fill="#9924DF"
              d="M889.3,100.5c-2.6,0-5.1-4.5-5.1-5.9V53.8c0-2.4,3.8-4.8,7.4-4.8h24.2c1.8,0,2.7,0.9,2.7,2.6
              c0,2.6-1.2,5.3-2.6,6.7c-0.8,0.7-1.5,1-2.3,1h-19.1v10.4h18c1.7,0,2.6,0.8,2.6,2.4c0,3.6-2.3,7.1-4.6,7.1h-16v11h22
              c1.8,0,2.7,0.9,2.7,2.6c0,2.6-1.2,5.3-2.6,6.7c-0.8,0.7-1.5,1-2.3,1H889.3z"
            />
          </g>
        </svg>
      </a>
    </div>`;
  }
}

export default CopyrightComponent;