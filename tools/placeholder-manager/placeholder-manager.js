// eslint-disable-next-line import/no-unresolved
import 'https://da.live/nx/public/sl/components.js';
// eslint-disable-next-line import/no-unresolved
import getStyle from 'https://da.live/nx/utils/styles.js';
// eslint-disable-next-line import/no-unresolved
import { LitElement, html, nothing } from 'da-lit';
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
const { token } = await DA_SDK;

const style = await getStyle(import.meta.url);

class PlaceholderManager extends LitElement {
  static properties = {
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    placeholderData: { type: Object, state: true },
    statusMessage: { type: String, state: true },
    statusType: { type: String, state: true }, // 'success', 'error', 'info'
    basePath: { type: String, state: true },
  };

  constructor(props) {
    super(props);
    this.loading = true;
    this.error = null;
    this.placeholderData = {};
    this.statusMessage = '';
    this.statusType = 'info';

    // Initialize basePath from window query parameter, default to /hannessolo/da-playground
    const urlParams = new URLSearchParams(window.location.search);
    this.basePath = urlParams.get('basePath') || '/hannessolo/da-playground';

    // Extract org, site, and folders from basePath for reuse in URL building
    const pathParts = this.basePath.split('/').filter(part => part);
    this.org = pathParts[0];
    this.site = pathParts[1];
    this.folders = pathParts.slice(2).join('/');
  }

  addCacheBust(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cacheBust=${Math.random().toString(36).substring(7)}`;
  }

  buildPlaceholdersAdminUrl(mode = 'preview') {
    const foldersPath = this.folders ? `/${this.folders}` : '';
    return `https://admin.hlx.page/${mode}/${this.org}/${this.site}/main${foldersPath}/placeholders.json`;
  }

  buildPlaceholdersUrl(mode = 'preview') {
    const foldersPath = this.folders ? `/${this.folders}` : '';
    if (mode === 'preview') {
      return `https://main--${this.site}--${this.org}.aem.page${foldersPath}/placeholders.json`;
    } else {
      return `https://main--${this.site}--${this.org}.aem.live${foldersPath}/placeholders.json`;
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
    await this.loadPlaceholderData();
  }

  async loadPlaceholderData() {
    try {
      this.loading = true;
      this.error = null;

      // First, get the list of types (directories) in .placeholders
      const typesUrl = this.addCacheBust(`https://admin.da.live/list${this.basePath}/.placeholders/`);
      const typesResponse = await fetch(typesUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!typesResponse.ok) {
        throw new Error(`Failed to fetch placeholder types: ${typesResponse.status} ${typesResponse.statusText}`);
      }

      const typesData = await typesResponse.json();
      console.log('Types data:', typesData);

      // Parse types for the simplified structure
      this.placeholderData = await this.parsePlaceholderData(typesData);

      this.loading = false;
    } catch (err) {
      console.error('Error loading placeholder data:', err);
      this.error = err.message;
      this.loading = false;
    }
  }

  async parsePlaceholderData(typesData) {
    const types = [];

    // Process each item in the types data to find type files
    typesData.forEach((item) => {
      if (item.path) {
        // Expected path structure: /<org>/<site>/.placeholders/<type>.json
        const pathParts = item.path.split('/');

        if (pathParts.length >= 4 && pathParts[pathParts.length - 2] === '.placeholders') {
          const fileName = pathParts[pathParts.length - 1];
          
          // Check if it's a .json file (not a directory)
          if (fileName && fileName.endsWith('.json')) {
            const type = fileName.replace('.json', '');
            types.push(type);
          }
        }
      }
    });

    return types.sort();
  }

  generateEditorLink(type) {
    // Editor links are always like da.live/sheet#<path>
    const path = `${this.basePath}/.placeholders/${type}`;
    return `https://da.live/sheet#${path}`;
  }

  createSheetName(type, sheetName) {
    // Create the final sheet name based on type and sheet name
    // This maintains the same naming convention as before
    if (sheetName === 'global') {
      return type;
    } else if (type === 'default') {
      return sheetName;
    } else {
      return `${type}-${sheetName}`;
    }
  }

  handleViewResult() {
    const url = `https://da.live/sheet#${this.basePath}/placeholders`;
    window.open(url, '_blank');
  }

  async handlePreview() {
    try {
      this.statusMessage = 'Publishing to preview...';
      this.statusType = 'info';

      const url = this.buildPlaceholdersAdminUrl('preview');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        this.statusMessage = 'Successfully published to preview!';
        this.statusType = 'success';

        // Open the preview URL
        const previewUrl = this.buildPlaceholdersUrl('preview');
        window.open(previewUrl, '_blank');
      } else {
        this.statusMessage = `Failed to publish to preview: ${response.status} ${response.statusText}`;
        this.statusType = 'error';
      }
    } catch (err) {
      console.error('Error publishing to preview:', err);
      this.statusMessage = `Error publishing to preview: ${err.message}`;
      this.statusType = 'error';
    }
  }

  async handlePublish() {
    try {
      this.statusMessage = 'Publishing to live...';
      this.statusType = 'info';

      const url = this.buildPlaceholdersAdminUrl('live');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        this.statusMessage = 'Successfully published to live!';
        this.statusType = 'success';

        // Open the live URL
        const liveUrl = this.buildPlaceholdersUrl('live');
        window.open(liveUrl, '_blank');
      } else {
        this.statusMessage = `Failed to publish to live: ${response.status} ${response.statusText}`;
        this.statusType = 'error';
      }
    } catch (err) {
      console.error('Error publishing to live:', err);
      this.statusMessage = `Error publishing to live: ${err.message}`;
      this.statusType = 'error';
    }
  }

  async handleCopy() {
    console.log('Copy button clicked');
    this.statusMessage = 'Processing placeholder data...';
    this.statusType = 'info';

    try {
      const multiSheetResult = {
        ':version': 3,
        ':names': [],
        ':type': 'multi-sheet'
      };

      // Process each type
      for (const type of this.placeholderData) {
        console.log(`\n=== Processing type: ${type} ===`);

        // Fetch the single multi-sheet file for this type
        const typePath = `${this.basePath}/.placeholders/${type}.json`;
        const typeSourceUrl = this.addCacheBust(`https://admin.da.live/source${typePath}`);

        try {
          const typeResponse = await fetch(typeSourceUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (typeResponse.ok) {
            const typeData = await typeResponse.json();
            console.log(`Multi-sheet data from ${type}.json:`, typeData);

            // Check if it's a valid multi-sheet structure
            if (typeData[':type'] === 'multi-sheet' && typeData[':names']) {
              // First, get the base data from the "all" sheet
              let baseData = null;
              if (typeData.all) {
                baseData = typeData.all;
                console.log(`Base data from ${type}/all sheet:`, typeData.all);
              } else {
                console.warn(`No "all" sheet found for type ${type}`);
                baseData = { data: [] }; // Start with empty data if no all sheet
              }

              // Now process each sheet in the multi-sheet (excluding "all")
              for (const sheetName of typeData[':names']) {
                if (sheetName === 'all') continue; // Skip all sheet as we already processed it

                if (typeData[sheetName]) {
                  console.log(`\n--- Processing sheet: ${type}/${sheetName} ---`);

                  // Get the sheet data
                  const sheetData = typeData[sheetName];
                  console.log(`Sheet data from ${type}/${sheetName}:`, sheetData);

                  // Merge the data: start with base (all) and overlay sheet-specific values
                  const mergedData = this.mergePlaceholderData(baseData, sheetData);

                  // Create the final sheet name based on type and sheet name
                  const finalSheetName = this.createSheetName(type, sheetName);
                  
                  // Add to multi-sheet result
                  multiSheetResult[finalSheetName] = {
                    total: mergedData.total || mergedData.data?.length || 0,
                    offset: 0,
                    limit: mergedData.total || mergedData.data?.length || 0,
                    data: mergedData.data || []
                  };

                  // Add sheet name to names array
                  multiSheetResult[':names'].push(finalSheetName);

                  console.log(`Added sheet "${finalSheetName}" with ${mergedData.data?.length || 0} items`);
                }
              }
            } else {
              console.warn(`Invalid multi-sheet structure for type ${type}`);
            }
          } else {
            console.error(`Failed to fetch ${type}.json: ${typeResponse.status} ${typeResponse.statusText}`);
          }
        } catch (err) {
          console.error(`Error fetching ${type}.json:`, err);
        }
      }

      console.log('\n=== BEFORE POST-PROCESSING ===');
      console.log('Multi-sheet placeholder data:', JSON.stringify(multiSheetResult, null, 2));

      // Apply post-processing to merge sheets according to the specified rules
      const postProcessedResult = this.postProcessMultiSheet(multiSheetResult);

      console.log('\n=== AFTER POST-PROCESSING ===');
      console.log('Post-processed multi-sheet data:', JSON.stringify(postProcessedResult, null, 2));

      // POST the data to the endpoint
      await this.postPlaceholderData(postProcessedResult);

    } catch (err) {
      console.error('Error in copy:', err);
      this.statusMessage = `Error: ${err.message}`;
      this.statusType = 'error';
    }
  }

  async postPlaceholderData(multiSheetData) {
    try {
      console.log('\n=== POSTING TO ENDPOINT ===');
      this.statusMessage = 'Copying placeholder data...';
      this.statusType = 'info';

      const url = this.addCacheBust(`https://admin.da.live/source${this.basePath}/placeholders.json`);

      // Create FormData with the multi-sheet data
      const body = new FormData();
      body.append('data', new Blob([JSON.stringify(multiSheetData)], { type: 'application/json' }));

      // POST the data
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: body
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Successfully posted placeholder data:', result);
        this.statusMessage = 'Placeholder data successfully copied!';
        this.statusType = 'success';
      } else {
        console.error(`Failed to post placeholder data: ${response.status} ${response.statusText}`);
        this.statusMessage = `Failed to copy placeholder data: ${response.status} ${response.statusText}`;
        this.statusType = 'error';
      }
    } catch (err) {
      console.error('Error posting placeholder data:', err);
      this.statusMessage = `Error copying placeholder data: ${err.message}`;
      this.statusType = 'error';
    }
  }

  mergePlaceholderData(baseData, regionData) {
    // Create a deep copy of the base data
    const merged = JSON.parse(JSON.stringify(baseData));

    // Create a map of existing keys in base data for quick lookup
    const baseKeyMap = new Map();
    if (merged.data && Array.isArray(merged.data)) {
      merged.data.forEach(item => {
        if (item.Key) {
          baseKeyMap.set(item.Key, item);
        }
      });
    }

    // Merge region data
    if (regionData.data && Array.isArray(regionData.data)) {
      regionData.data.forEach(regionItem => {
        if (regionItem.Key) {
          if (baseKeyMap.has(regionItem.Key)) {
            // Update existing key with region value
            const existingItem = baseKeyMap.get(regionItem.Key);
            console.log(`  Overriding key "${regionItem.Key}": "${existingItem.Text}" -> "${regionItem.Text}"`);
            existingItem.Text = regionItem.Text; // Override the text value
          } else {
            // Add new key from region
            merged.data.push(regionItem);
            baseKeyMap.set(regionItem.Key, regionItem);
            console.log(`  Adding new key "${regionItem.Key}": "${regionItem.Text}"`);
          }
        }
      });
    }

    // Update metadata
    if (regionData[':colWidths']) {
      merged[':colWidths'] = regionData[':colWidths'];
    }
    if (regionData[':sheetname']) {
      merged[':sheetname'] = regionData[':sheetname'];
    }
    if (regionData[':type']) {
      merged[':type'] = regionData[':type'];
    }

    // Sort data alphabetically by key
    if (merged.data && Array.isArray(merged.data)) {
      merged.data.sort((a, b) => {
        const keyA = a.Key || '';
        const keyB = b.Key || '';
        return keyA.localeCompare(keyB);
      });
    }

    // Update total count
    merged.total = merged.data ? merged.data.length : 0;

    return merged;
  }

  postProcessMultiSheet(multiSheetData) {
    console.log('\n=== POST-PROCESSING MULTI-SHEET ===');

    // Create a deep copy to avoid modifying the original
    const result = JSON.parse(JSON.stringify(multiSheetData));

    // Special case: Merge "banner" with "default" (banner overwrites duplicate keys)
    if (result.banner && result.default) {
      console.log('Merging banner with default (banner overwrites)...');
      const mergedDefault = this.mergePlaceholderData(result.default, result.banner);
      result.default = mergedDefault;

      // Remove the banner sheet since it's now merged into default
      delete result.banner;
      result[':names'] = result[':names'].filter(name => name !== 'banner');

      console.log(`Merged banner into default. Default now has ${mergedDefault.data?.length || 0} items.`);
    }

    // Normal case: Merge each region with its corresponding "banner-region"
    // Find all banner-* sheets and their corresponding region sheets
    const bannerSheets = result[':names'].filter(name => name.startsWith('banner-'));

    bannerSheets.forEach(bannerSheetName => {
      // Extract region name from banner sheet (e.g., "banner-uae" -> "uae")
      const regionName = bannerSheetName.replace('banner-', '');

      // Check if corresponding region sheet exists
      if (result[regionName]) {
        console.log(`Merging ${bannerSheetName} with ${regionName} (banner overwrites)...`);
        const mergedRegion = this.mergePlaceholderData(result[regionName], result[bannerSheetName]);
        result[regionName] = mergedRegion;

        // Remove the banner sheet since it's now merged
        delete result[bannerSheetName];
        result[':names'] = result[':names'].filter(name => name !== bannerSheetName);

        console.log(`Merged ${bannerSheetName} into ${regionName}. ${regionName} now has ${mergedRegion.data?.length || 0} items.`);
      } else {
        console.log(`Warning: Found ${bannerSheetName} but no corresponding ${regionName} sheet to merge with.`);
      }
    });

    console.log('Post-processing complete. Final sheet names:', result[':names']);
    return result;
  }


  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <h1>Placeholder Manager</h1>
          <p class="org-site-info">Organization/Site: <strong>${this.basePath}</strong></p>
          <p>Loading placeholder files...</p>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div>
          <h1>Placeholder Manager</h1>
          <p class="org-site-info">Organization/Site: <strong>${this.basePath}</strong></p>
          <div class="error">
            <p>Error: ${this.error}</p>
            <button @click=${this.loadPlaceholderData} class="copy-publish-button" style="background: #dc3545; margin-top: 1rem;">
              Retry
            </button>
          </div>
        </div>
      `;
    }

    const types = this.placeholderData;

    if (types.length === 0) {
      return html`
        <div>
          <h1>Placeholder Manager</h1>
          <p class="org-site-info">Organization/Site: <strong>${this.basePath}</strong></p>
          <p>No placeholder files found in ${this.basePath}/.placeholders/</p>
        </div>
      `;
    }

    return html`
      <div class="ai-bot">
        <h1>Placeholder Manager</h1>
        <p class="org-site-info">Organization/Site: <strong>${this.basePath}</strong></p>
        <p>Manage placeholder files by type:</p>

        <div class="file-list">
          ${types.map(type => html`
            <div class="type-item">
              <span class="type-name">${type}</span>
              <a
                href="${this.generateEditorLink(type)}"
                target="_blank"
                class="editor-link"
              >
                Open in Editor
              </a>
            </div>
          `)}
        </div>

        <div class="button-group">
          <button
            @click=${this.handleCopy}
            class="copy-publish-button"
          >
            Copy
          </button>

          <button
            @click=${this.handleViewResult}
            class="view-result-button"
          >
            View Generated Placeholders
          </button>
        </div>

        <div class="button-group">
          <button
            @click=${this.handlePreview}
            class="preview-button"
          >
            Preview
          </button>

          <button
            @click=${this.handlePublish}
            class="publish-button"
          >
            Publish
          </button>
        </div>

        ${this.statusMessage ? html`
          <div class="status-message status-${this.statusType}">
            ${this.statusMessage}
          </div>
        ` : nothing}
      </div>
    `;
  }
}

customElements.define('placeholder-manager', PlaceholderManager);
