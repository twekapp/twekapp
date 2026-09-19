if (typeof globalThis.WebSocket === 'undefined') {
  class WebSocket {
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3
    readyState = 3
    close() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
  }
  globalThis.WebSocket = WebSocket
}
