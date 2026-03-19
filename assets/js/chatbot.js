(function() {
  let chatOpen = false;
  
  window.chatToggle = function() {
    chatOpen = !chatOpen;
    document.getElementById('chat-modal').classList.toggle('open', chatOpen);
    if (chatOpen && document.getElementById('chat-messages').children.length === 0) chatLoadHistory();
  };

  /**
   * Formats and cleans bot responses
   * - Removes asterisks (* and **)
   * - Converts markdown-style formatting to readable text
   * - PRESERVES paragraph breaks for readability
   * - Removes horizontal line separators (---, ---, etc.)
   */
  function formatBotMessage(text) {
    if (!text) return '';

    // Remove asterisks (*, **, _)
    text = text.replace(/\*\*/g, ''); // Remove **
    text = text.replace(/\*/g, '');   // Remove *
    text = text.replace(/__/g, '');   // Remove __
    text = text.replace(/_/g, '');    // Remove _

    // Remove hashtags but keep text (e.g., "##Header" → "Header")
    text = text.replace(/#{1,6}\s+/g, '');

    // Convert markdown list items to regular text (preserve)
    // - Item → • Item
    text = text.replace(/^\s*[-*]\s+/gm, '• ');

    // Remove horizontal line separators (---, ---, ***)
    text = text.replace(/^\s*[-_*]{3,}\s*$/gm, '');

    // Normalize multiple line breaks to double line breaks
    text = text.replace(/\n\n+/g, '\n\n');
    
    // Remove empty paragraphs (from removed separators)
    text = text.replace(/\n\n\n+/g, '\n\n');
    
    // IMPORTANT: Do NOT collapse spaces - preserve paragraph structure
    // Only trim the very beginning and end
    text = text.trim();

    return text;
  }

  /**
   * Chunks long messages by paragraph boundaries
   * Max 800 characters per chunk to keep complete thoughts together
   */
  function chunkMessage(text) {
    // Split by double newlines (paragraph breaks) first
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    if (paragraphs.length <= 1) {
      // If no paragraphs, return the whole text as single chunk
      return [text];
    }
    
    // Group paragraphs together until we reach max length
    const maxLength = 800;
    const chunks = [];
    let currentChunk = '';

    paragraphs.forEach(paragraph => {
      const trimmed = paragraph.trim();
      const combined = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
      
      if (combined.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = trimmed;
      } else {
        currentChunk = combined;
      }
    });

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Add a message to the chat
   * For bot messages with multiple paragraphs, each paragraph becomes a separate message bubble
   */
  function chatAddMsg(text, role, id) {
    const win = document.getElementById('chat-messages');
    
    // Format bot messages
    if (role === 'bot') {
      text = formatBotMessage(text);
    }

    // For bot messages, split paragraphs into separate message bubbles
    if (role === 'bot') {
      // Split by double newlines to get paragraphs
      const paragraphs = text.split('\n\n').filter(p => p.trim());
      
      // Create a separate message bubble for each paragraph
      paragraphs.forEach((para, index) => {
        const div = document.createElement('div');
        div.className = 'chat-msg ' + role;
        // Only set ID on the first paragraph
        if (index === 0 && id) div.id = id;
        // Use pre-wrap to preserve text formatting within the paragraph
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.textContent = para.trim();
        win.appendChild(div);
      });
    } else {
      // User messages displayed as single bubble
      const div = document.createElement('div');
      div.className = 'chat-msg ' + role;
      if (id) div.id = id;
      div.textContent = text;
      win.appendChild(div);
    }

    win.scrollTop = win.scrollHeight;
  }

  /**
   * Send message to backend
   */
  window.chatSend = async function(e) {
    e.preventDefault();
    const inp = document.getElementById('chat-input');
    const msg = inp.value.trim();
    if (!msg) return;

    chatAddMsg(msg, 'user');
    inp.value = '';

    const tid = 'typing-' + Date.now();
    const tEl = document.createElement('div');
    tEl.className = 'chat-msg bot';
    tEl.id = tid;
    tEl.innerHTML = '<span class="typing-dot">●</span><span class="typing-dot">●</span><span class="typing-dot">●</span>';
    document.getElementById('chat-messages').appendChild(tEl);
    document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      const reply = data.reply || "I couldn't process that right now.";

      // Remove the typing indicator
      tEl.remove();

      // Add formatted message
      chatAddMsg(reply, 'bot');
      chatSaveHistory(msg, reply);
    } catch(err) {
      console.error('Chat error:', err);
      tEl.textContent = 'Error connecting to AI assistant.';
    }
  };

  /**
   * Save chat history to localStorage
   */
  function chatSaveHistory(u, b) {
    try {
      const h = JSON.parse(localStorage.getItem('balik_chat') || '[]');
      h.push({ u, b });
      if (h.length > 30) h.shift();
      localStorage.setItem('balik_chat', JSON.stringify(h));
    } catch(e) {
      console.error('Error saving chat history:', e);
    }
  }

  /**
   * Load chat history from localStorage
   */
  function chatLoadHistory() {
    const win = document.getElementById('chat-messages');
    try {
      const h = JSON.parse(localStorage.getItem('balik_chat') || '[]');
      if (h.length === 0) {
        chatAddMsg(
          "👋 Hi there! I'm B.A.L.I.K. AI — your automated Lost & Found assistant for BulSU Bustos Campus.\n\n" +
          "I can help you with:\n" +
          "• Search for lost or found items\n" +
          "• Guide you through reporting an item\n" +
          "• Answer questions about the claiming process\n" +
          "• Provide campus information\n\n" +
          "Feel free to ask me anything!",
          'bot'
        );
        return;
      }
      h.forEach(item => {
        chatAddMsg(item.u, 'user');
        chatAddMsg(item.b, 'bot');
      });
    } catch(e) {
      console.error('Error loading chat history:', e);
      chatAddMsg("👋 Hi! I'm B.A.L.I.K. AI. How can I help you today?", 'bot');
    }
  }

  // Auto-open with greeting after 3 seconds on first visit
  if (!localStorage.getItem('balik_chat_greeted')) {
    setTimeout(function() {
      localStorage.setItem('balik_chat_greeted', '1');
      window.chatToggle();
    }, 3000);
  }
})();