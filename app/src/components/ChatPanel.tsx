import React from 'react'

export default function ChatPanel(){
  return (
    <section className="chat-panel glass">
      <div className="messages">AI Chat Interface (structured JSON internals)</div>
      <footer className="composer">
        <input placeholder="Ask Founder Falcon..." />
        <button>Send</button>
      </footer>
    </section>
  )
}
