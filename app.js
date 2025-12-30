/**
 * AI Estimation System V2 - Chat UI
 * Conversational interface for estimation consultation
 */

// Configuration
const API_ENDPOINT = 'https://estimation-agent-app.blueplant-e852c27d.eastus2.azurecontainerapps.io/score';

// State management
const state = {
  sessionId: null,
  conversationHistory: [],
  isComplete: false,
  finalMarkdown: null,
  isWaitingForResponse: false
};

// DOM Elements
const chatTimeline = document.getElementById('chat-timeline');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const downloadArea = document.getElementById('download-area');
const downloadBtn = document.getElementById('download-btn');
const loading = document.getElementById('loading');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeChat();
  setupEventListeners();
});

/**
 * Initialize chat with welcome message
 */
function initializeChat() {
  addAIMessage(
    'こんにちは！開発プロジェクトの見積もりをお手伝いいたします。\nまず、どのようなシステムを開発されますか？',
    [
      { label: 'Webアプリケーション', value: 'web_app' },
      { label: 'モバイルアプリ', value: 'mobile_app' },
      { label: 'Web + モバイル', value: 'both' },
      { label: 'その他', value: 'other' }
    ]
  );
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Send button click
  sendBtn.addEventListener('click', handleSendMessage);

  // Enter key in input field
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Download button click
  downloadBtn.addEventListener('click', handleDownload);
}

/**
 * Handle send message
 */
async function handleSendMessage() {
  const message = userInput.value.trim();

  if (!message || state.isWaitingForResponse) {
    return;
  }

  // Add user message to UI
  addUserMessage(message);

  // Clear input
  userInput.value = '';

  // Send to API
  await sendMessageToAPI(message);
}

/**
 * Handle option button click
 */
async function handleOptionClick(option, buttonElement) {
  if (state.isWaitingForResponse) {
    return;
  }

  // Disable all option buttons in this message
  const optionsContainer = buttonElement.parentElement;
  const allButtons = optionsContainer.querySelectorAll('.option-btn');
  allButtons.forEach(btn => btn.disabled = true);

  // Add user message
  addUserMessage(option.label);

  // If "Other" is selected, focus input for free text
  if (option.value === 'other' || option.label.includes('その他')) {
    userInput.focus();
  }

  // Send to API
  await sendMessageToAPI(option.label, option.value);
}

/**
 * Send message to API
 */
async function sendMessageToAPI(message, selectedOption = null) {
  state.isWaitingForResponse = true;
  showLoading();

  try {
    const requestBody = {
      user_input: {
        message: message,
        selected_option: selectedOption
      },
      session_id: state.sessionId,
      conversation_history: state.conversationHistory
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Update session ID
    if (data.session_id) {
      state.sessionId = data.session_id;
    }

    // Update conversation history
    state.conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: data.message }
    );

    // Check if conversation is complete
    if (data.is_complete) {
      state.isComplete = true;
      state.finalMarkdown = data.markdown;

      // Show AI message
      addAIMessage(data.message);

      // Show download button
      showDownloadButton();
    } else {
      // Show AI message with options
      addAIMessage(data.message, data.options);
    }

  } catch (error) {
    console.error('Error sending message:', error);
    addAIMessage(
      '申し訳ございません。エラーが発生しました。もう一度お試しください。\n\nエラー: ' + error.message
    );
  } finally {
    hideLoading();
    state.isWaitingForResponse = false;
  }
}

/**
 * Add user message to chat
 */
function addUserMessage(message) {
  const messageEl = createMessageElement('user', message);
  chatTimeline.appendChild(messageEl);
  scrollToBottom();
}

/**
 * Add AI message to chat
 */
function addAIMessage(message, options = null) {
  const messageEl = createMessageElement('ai', message);

  // Add options if present
  if (options && options.length > 0) {
    const optionsEl = createOptionsElement(options);
    messageEl.appendChild(optionsEl);
  }

  chatTimeline.appendChild(messageEl);
  scrollToBottom();
}

/**
 * Create message element
 */
function createMessageElement(type, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message fade-in`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;

  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'message-timestamp';
  timestampDiv.textContent = getCurrentTime();

  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(timestampDiv);

  return messageDiv;
}

/**
 * Create options element
 */
function createOptionsElement(options) {
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'message-options';

  options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.textContent = option.label;

    // Add special class for "その他" button
    if (option.value === 'other' || option.label.includes('その他')) {
      button.classList.add('other-btn');
    }

    button.addEventListener('click', () => handleOptionClick(option, button));

    optionsDiv.appendChild(button);
  });

  return optionsDiv;
}

/**
 * Show loading indicator
 */
function showLoading() {
  loading.style.display = 'flex';
  sendBtn.disabled = true;
  userInput.disabled = true;
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  loading.style.display = 'none';
  sendBtn.disabled = false;
  userInput.disabled = false;
  userInput.focus();
}

/**
 * Show download button
 */
function showDownloadButton() {
  downloadArea.style.display = 'block';
  downloadArea.classList.add('fade-in');
}

/**
 * Handle download
 */
function handleDownload() {
  if (!state.finalMarkdown) {
    alert('ダウンロード可能な見積もり書がありません。');
    return;
  }

  // Create blob
  const blob = new Blob([state.finalMarkdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Create download link
  const a = document.createElement('a');
  a.href = url;
  a.download = `見積もり相談_${getDateString()}.md`;

  // Trigger download
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Scroll to bottom of chat
 */
function scrollToBottom() {
  setTimeout(() => {
    chatTimeline.scrollTop = chatTimeline.scrollHeight;
  }, 100);
}

/**
 * Get current time string
 */
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get date string for filename
 */
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
