// eslint-disable-next-line import/no-unresolved
import 'https://da.live/nx/public/sl/components.js';
// eslint-disable-next-line import/no-unresolved
import getStyle from 'https://da.live/nx/utils/styles.js';
// eslint-disable-next-line import/no-unresolved
import { LitElement, html, nothing } from 'da-lit';

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
  }

  async connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  handleSubmit(e) {
    e.preventDefault();
    const prompt = this.shadowRoot.querySelector('sl-input').value;
    this.messages.push({
      role: 'user',
      content: prompt,
    });

    this.loading = true;

    fetch('http://localhost:3001', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: this.messages }),
    }).then((res) => res.json()).then((data) => {
      this.messages.push({
        role: 'assistant',
        content: data.response,
      });
      this.loading = false;
    }).catch((e) => {
      this.loading = false;
      console.error(`Error fetching data ${e}`);
    });
  }

  render() {
    return html`
      <div class="ai-bot">
        <h1>AI Bot</h1>
        <p>Enter authoring tasks in natural language:</p>
        <form>
          <sl-input type="text" label="Query" name="query"></sl-input>
          ${this.loading ? nothing : html`<sl-button @click="${this.handleSubmit}" type="submit">Submit</sl-button>`}
          ${this.loading ? html`Loading...` : nothing}
          ${this.messages.map((message) => html`
            <div class="${message.role === 'user' ? 'message user' : 'message ai'}">
              <div class="message-role">
                ${message.role}
              </div>
              <div class="message-content">
                ${message.content}
              </div>
            </div>
          `)}
        </form>
      </div>
    `;
  }
}

customElements.define('ai-bot', AiBot);
