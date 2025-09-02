// eslint-disable-next-line import/no-unresolved
import 'https://da.live/nx/public/sl/components.js';
// eslint-disable-next-line import/no-unresolved
import getStyle from 'https://da.live/nx/utils/styles.js';
// eslint-disable-next-line import/no-unresolved
import { LitElement, html, nothing } from 'da-lit';

const style = await getStyle(import.meta.url);

export class CsvImporter extends LitElement {
  async connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  render() {
    return html`
      <div>
        <h1>CSV Importer</h1>
        <div class="forms-container">
          <div class="form-section">
            <h2>Import from JSON URL</h2>
            <form @submit=${this.handleJsonUrlSubmit}>
              <sl-input 
                type="url" 
                label="JSON URL" 
                name="jsonUrl" 
                placeholder="https://example.com/data.json"
                required>
              </sl-input>
              <sl-button type="submit">Import from URL</sl-button>
            </form>
          </div>

          <div class="form-section">
            <h2>Convert CSV to JSON</h2>
            <form @submit=${this.handleCsvSubmit}>
              <sl-input 
                type="file" 
                label="CSV File" 
                name="csvFile" 
                accept=".csv"
                required>
              </sl-input>
              <sl-input 
                type="url" 
                label="Save URL" 
                name="saveUrl" 
                placeholder="https://example.com/save-endpoint"
                required>
              </sl-input>
              <sl-button type="submit">Convert and Save</sl-button>
            </form>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('csv-importer', CsvImporter);
