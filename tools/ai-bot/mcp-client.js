import { Client, SSEClientTransport } from '../../dist/mcp.js';

class MCPClient {
  constructor() {
    this.mcp = new Client({
      name: 'da-client',
      version: '1.0.0',
    }, {
      capabilities: {},
    });
    this.tools = [];
  }

  async connectToServer() {
    try {
      const transport = new SSEClientTransport(
        new URL('http://localhost:3001/sse'),
      );
      await this.mcp.connect(transport);

      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));
      console.log(JSON.stringify(this.tools, null, 2));
      console.log(
        'Connected to server with tools:',
        this.tools.map((tool) => tool.function.name),
      );
    } catch (e) {
      console.log('Failed to connect to MCP server: ', e);
      throw e;
    }
  }

  async fetchAIResponse(messages) {
    console.log(JSON.stringify(messages));

    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'hf.co/lmstudio-community/Qwen2.5-7B-Instruct-1M-GGUF:Q8_0',
        stream: false,
        tools: this.tools,
      }),
    });

    if (!res.ok) {
      throw new Error(`Error fetching AI response: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`Error from AI: ${data.error}`);
    }
    return data;
  }

  async processQuery(messages) {
    const response = await this.fetchAIResponse(messages);

    const finalText = [];

    messages.push(response.message);

    if (response.message.content) {
      finalText.push(response.message.content);
    }

    let toolCalls = response.message.tool_calls;

    console.log('Tool calls: ', toolCalls);

    while (toolCalls?.length > 0) {
      const promises = response.message.tool_calls?.map(async (toolCall) => {
        if (!toolCall.function) { return ''; }

        const toolResult = await this.mcp
          .callTool({ name: toolCall.function.name, arguments: toolCall.function.arguments });
        return toolResult.content[0].text;
      });

      // eslint-disable-next-line no-await-in-loop
      const toolResults = await Promise.all(promises);

      toolResults.forEach((toolResult) => {
        messages.push({ role: 'tool', content: toolResult });
      });

      // eslint-disable-next-line no-await-in-loop
      const toolResponse = await this.fetchAIResponse(messages);
      messages.push(toolResponse.message);
      finalText.push(toolResponse.message.content);
      toolCalls = toolResponse.message.tool_calls;
    }

    return finalText.join('\n');
  }
}

export default MCPClient;
