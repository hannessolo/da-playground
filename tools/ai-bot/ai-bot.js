// eslint-disable-next-line import/no-unresolved
import 'https://da.live/nx/public/sl/components.js';
// eslint-disable-next-line import/no-unresolved
import getStyle from 'https://da.live/nx/utils/styles.js';
// eslint-disable-next-line import/no-unresolved
import { LitElement, html, nothing } from 'da-lit';
import MCPClient from './mcp-client.js';

const style = await getStyle(import.meta.url);

class AiBot extends LitElement {
  static properties = {
    loading: { state: true },
    messages: [{ state: true }],
  };

  constructor(props) {
    super(props);
    this.loading = false;
    this.messages = [];
    this.mcp = new MCPClient();
    this.llm = 'llama3.2';
  }

  async connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
    this.mcp.connectToServer();
  }

  handleSubmit(e) {
    e.preventDefault();
    const prompt = this.shadowRoot.querySelector('sl-input').value;
    this.messages.push({
      role: 'user',
      content: prompt,
    });

    this.loading = true;

    this.mcp.processQuery(this.messages, this.llm).then(() => {
      this.loading = false;
    });
  }

  render() {
    return html`
      <div class="ai-bot">
        <h1>AI Bot</h1>
        <p>Enter authoring tasks in natural language:</p>
        <form>
          <sl-select
              label="Model"
              name="model"
              .value=${this.llm}
              @change=${(e) => { this.llm = e.target.value; }}>
            <option value="llama3.2">llama</option>
            <option value="hf.co/lmstudio-community/Qwen2.5-7B-Instruct-1M-GGUF:Q8_0">Qwen</option>
          </sl-select>
          <sl-input type="text" label="Query" name="query"></sl-input>
          ${this.loading ? nothing : html`<sl-button @click="${this.handleSubmit}" type="submit">Submit</sl-button>`}
          ${this.loading ? html`Loading...` : nothing}
          ${this.messages.slice().reverse().map((message) => html`
            <div class="${message.role === 'user' ? 'message user' : 'message ai'}">
              <div class="message-role">
                ${message.role}
              </div>
              <div class="message-content">
                ${message.content}
                ${message.tool_calls ? html`Calling tool ${message.tool_calls.map((call) => call.function.name)}` : nothing}
              </div>
            </div>
          `)}
        </form>
      </div>
    `;
  }
}

customElements.define('ai-bot', AiBot);
