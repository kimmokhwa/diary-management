// MCP(WebSocket) 클라이언트
class MCPClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.messageQueue = [];
  }

  connect() {
    this.ws = new WebSocket(import.meta.env.VITE_MCP_ENDPOINT);
    
    this.ws.onopen = () => {
      this.connected = true;
      this.processQueue();
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.ws.onclose = () => {
      this.connected = false;
      // 재연결 로직
      setTimeout(() => this.connect(), 5000);
    };
  }

  send(message) {
    if (this.connected) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  processQueue() {
    while (this.messageQueue.length > 0 && this.connected) {
      this.send(this.messageQueue.shift());
    }
  }

  handleMessage(data) {
    // MCP 메시지 처리
    window.dispatchEvent(new CustomEvent('mcp-message', { detail: data }));
  }
}

export const mcpClient = new MCPClient(); 