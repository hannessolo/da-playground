// eslint-disable-next-line import/no-unresolved
import 'https://da.live/nx/public/sl/components.js';
// eslint-disable-next-line import/no-unresolved
import getStyle from 'https://da.live/nx/utils/styles.js';
// eslint-disable-next-line import/no-unresolved
import { LitElement, html, nothing } from 'da-lit';

const style = await getStyle(import.meta.url);

class ProjectSwitcher extends LitElement {
  static properties = {
    loading: { type: Boolean, state: true },
    projects: { type: Array, state: true },
    selectedBrand: { type: String, state: true },
    selectedEnv: { type: String, state: true },
    selectedRegion: { type: String, state: true },
  };

  constructor(props) {
    super(props);
  }

  async connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
    const url = 'https://admin.da.live/list/alshaya-axp/';
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    
    // Loop through each item in the data array
    const parsedData = data.map((item, index) => {
      console.log(`Item ${index}:`, item);
      
      if (item.path) {
        const siteName = item.path.split('/')[2];
        const brand = siteName.split('-')[0];
        const env = siteName.split('-')[1];
        const region = siteName.split('-')[2];
        return { brand, env, region };
      } else {
        console.log(`Item ${index} has no path property:`, item);
        return null;
      }
    }).filter((item) => item !== null && item.brand && item.env && item.region);
    this.projects = parsedData;
    
    // Initialize with first available options
    if (this.projects.length > 0) {
      this.selectedBrand = this.projects[0].brand;
      this.selectedEnv = this.projects[0].env;
      this.selectedRegion = this.projects[0].region;
    }
  }

  handleBrandChange(brand) {
    this.selectedBrand = brand;
    this.selectedEnv = '';
    this.selectedRegion = '';
  }

  handleEnvChange(env) {
    this.selectedEnv = env;
    this.selectedRegion = '';
  }

  handleRegionChange(region) {
    this.selectedRegion = region;
  }

  handleGoClick() {
    if (this.selectedBrand && this.selectedEnv && this.selectedRegion) {
      const url = `https://da.live/#/alshaya-axp/${this.selectedBrand}-${this.selectedEnv}-${this.selectedRegion}-da`;
      window.open(url, '_blank');
    }
  }

  render() {
    if (this.loading) {
      return html`<div>Loading...</div>`;
    }

    if (!this.projects || this.projects.length === 0) {
      return html`<div>No projects available</div>`;
    }

    // Get unique values for each level
    const brands = [...new Set(this.projects.map(p => p.brand))];
    const envs = this.selectedBrand ? [...new Set(this.projects.filter(p => p.brand === this.selectedBrand).map(p => p.env))] : [];
    const regions = this.selectedBrand && this.selectedEnv ? [...new Set(this.projects.filter(p => p.brand === this.selectedBrand && p.env === this.selectedEnv).map(p => p.region))] : [];

    return html`
      <div class="ai-bot">
        <h1>Alshaya Project Switcher</h1>
        <p>Select the site to edit:</p>
        
        <div class="selection-tree">
          <!-- Brand Selection -->
          <div class="selection-level">
            <label for="brand-select">Brand:</label>
            <select 
              id="brand-select" 
              @change=${(e) => this.handleBrandChange(e.target.value)}
              .value=${this.selectedBrand || ''}
            >
              <option value="">Select Brand</option>
              ${brands.map(brand => html`<option value="${brand}">${brand}</option>`)}
            </select>
          </div>

          <!-- Environment Selection -->
          <div class="selection-level">
            <label for="env-select">Environment:</label>
            <select 
              id="env-select" 
              @change=${(e) => this.handleEnvChange(e.target.value)}
              .value=${this.selectedEnv || ''}
              ?disabled=${!this.selectedBrand}
            >
              <option value="">Select Environment</option>
              ${envs.map(env => html`<option value="${env}">${env}</option>`)}
            </select>
          </div>

          <!-- Region Selection -->
          <div class="selection-level">
            <label for="region-select">Region:</label>
            <select 
              id="region-select" 
              @change=${(e) => this.handleRegionChange(e.target.value)}
              .value=${this.selectedRegion || ''}
              ?disabled=${!this.selectedEnv}
            >
              <option value="">Select Region</option>
              ${regions.map(region => html`<option value="${region}">${region}</option>`)}
            </select>
          </div>

          <!-- Go Button -->
          <div class="selection-level">
            <button 
              @click=${this.handleGoClick}
              ?disabled=${!this.selectedBrand || !this.selectedEnv || !this.selectedRegion}
              class="go-button"
            >
              Go to Site
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('project-switcher', ProjectSwitcher);
