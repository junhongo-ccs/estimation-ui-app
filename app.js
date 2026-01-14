/**
 * AI Estimation System V2 - Chat UI
 * Conversational interface for estimation consultation
 */

// Configuration
const API_ENDPOINT = 'https://estimation-agent-core.azurewebsites.net/score';

// State management
const state = {
  sessionId: null,
  conversationHistory: [],
  isComplete: false,
  finalMarkdown: null,
  isWaitingForResponse: false,
  gate: {
    stage: 'gate1',
    devType: null,
    method: null,
    nfrs: []
  }
};

const GATE1_OPTIONS = [
  { label: '新規開発', value: '新規開発' },
  { label: '既存移行', value: '既存移行' }
];

const NFR_OPTIONS = [
  { label: '可用性', value: '可用性' },
  { label: 'セキュリティ', value: 'セキュリティ' },
  { label: '性能', value: '性能' },
  { label: '保守性', value: '保守性' },
  { label: '可観測性', value: '可観測性' }
];

const METHOD_BY_DEVTYPE = {
  '新規開発': { label: '画面数法', value: '画面数法' },
  '既存移行': { label: 'STEP法', value: 'STEP法' }
};

// DOM Elements
const chatTimeline = document.getElementById('chat-timeline');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const downloadArea = document.getElementById('download-area');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const helpBtn = document.getElementById('help-btn');
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
  state.gate.stage = 'gate1';
  state.gate.devType = null;
  state.gate.method = null;
  state.gate.nfrs = [];
  updateInputLock();

  addAIMessage(
    'Gate 1（開発特性）: 「新規開発」か「既存移行」を選択してください。',
    GATE1_OPTIONS
  );
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Send button click
  sendBtn.addEventListener('click', handleSendMessage);

  // Enter key in input field
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Download button click
  downloadBtn.addEventListener('click', handleDownload);

  // Reset button click
  resetBtn.addEventListener('click', handleReset);

  // Help button click
  helpBtn.addEventListener('click', () => {
    window.open('help.html', '_blank');
  });
}

/**
 * Handle send message
 */
async function handleSendMessage() {
  const message = userInput.value.trim();

  if (!message || state.isWaitingForResponse) {
    return;
  }

  if (state.gate.stage !== 'open') {
    addAIMessage('通行証（Method/NFR）が未確定です。Gate 1〜3の選択を完了してください。');
    userInput.value = '';
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
async function handleOptionClick(option, buttonElement, isMultiSelect = false) {
  if (state.isWaitingForResponse) {
    return;
  }

  if (state.gate.stage === 'gate1') {
    await handleGate1Selection(option, buttonElement);
    return;
  }

  if (isMultiSelect) {
    // Toggle selection
    buttonElement.classList.toggle('selected');
    return;
  }

  // Single select mode (existing logic)
  const optionsContainer = buttonElement.parentElement;
  const allButtons = optionsContainer.querySelectorAll('.option-btn');
  allButtons.forEach(btn => btn.disabled = true);

  addUserMessage(option.label);

  if (option.value === 'other' || option.label.includes('その他')) {
    userInput.focus();
  }

  await sendMessageToAPI(option.label, option.value);
}

/**
 * Handle confirmation of multiple selections
 */
async function handleMultiSelectConfirm(optionsContainer) {
  if (state.isWaitingForResponse) return;

  const selectedButtons = optionsContainer.querySelectorAll('.option-btn.selected');
  const selectedLabels = Array.from(selectedButtons).map(btn => btn.textContent);

  if (selectedLabels.length === 0) {
    alert('少なくとも1つ選択してください。');
    return;
  }

  // Disable all buttons
  const allButtons = optionsContainer.querySelectorAll('.option-btn, .btn-confirm');
  allButtons.forEach(btn => btn.disabled = true);

  const combinedMessage = selectedLabels.join('、');
  addUserMessage(`非機能要件: ${combinedMessage}`);

  if (state.gate.stage === 'gate3') {
    state.gate.nfrs = [...selectedLabels];
    state.gate.stage = 'open';
    updateInputLock();
    await sendMessageToAPI(combinedMessage, combinedMessage);
    addAIMessage('通行証が揃いました。数値入力や自由記述を開始できます。');
    return;
  }

  await sendMessageToAPI(combinedMessage);
}

/**
 * Send message to API
 */
async function sendMessageToAPI(message, selectedOption = null, options = {}) {
  state.isWaitingForResponse = true;
  showLoading();

  // 見積もり確定時の特別演出
  if (message === 'はい、作成してください' || message.includes('作成してください')) {
    addAIMessage('それでは概算見積もりを計算します');
    await new Promise(resolve => setTimeout(resolve, 800));
    addAIMessage('計算中 ... ');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

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
      if (!options.suppressAssistant) {
        addAIMessage(data.message);
      }

      // Show download button
      showDownloadButton();
    } else {
      // Show AI message with options
      if (!options.suppressAssistant) {
        addAIMessage(data.message, data.options);
      }
    }

  } catch (error) {
    console.error('Error sending message:', error);
    const errorEl = createMessageElement('ai', '申し訳ございません。エラーが発生しました。もう一度お試しください。\n\nエラー: ' + error.message);
    errorEl.classList.add('error-message');
    chatTimeline.appendChild(errorEl);
    scrollToBottom();
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
  const messageEl = createMessageElement('ai', message, options);

  // Add options if present
  if (options && options.length > 0) {
    // 複数選択モードの判定キーワードを強化
    const isMultiSelect = /複数回答可|複数選択|すべて選んで|複数選んで|必要なものをすべて/.test(message);
    const optionsEl = createOptionsElement(options, isMultiSelect);
    messageEl.appendChild(optionsEl);
  }

  chatTimeline.appendChild(messageEl);
  scrollToBottom();
}

/**
 * Create message element
 */
function createMessageElement(type, content, options = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message fade-in`;

  // Create icon
  const iconDiv = document.createElement('div');
  iconDiv.className = 'message-icon';
  if (type === 'ai') {
    iconDiv.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8V4H8"></path>
        <rect width="16" height="12" x="4" y="8" rx="2"></rect>
        <path d="M2 14h2"></path>
        <path d="M20 14h2"></path>
        <path d="M15 13v2"></path>
        <path d="M9 13v2"></path>
      </svg>`;
  } else {
    iconDiv.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>`;
  }

  const messageBody = document.createElement('div');
  messageBody.className = 'message-body';

  // Clean content
  let displayContent = content;

  // 1. Strip markdown code block markers if present
  displayContent = displayContent.replace(/```markdown\n?|```/g, '').trim();

  // 2. Remove options from text area to turn them into buttons
  if (options && options.length > 0) {
    // Aggressive line-based cleanup
    options.forEach(opt => {
      const escapedOpt = opt.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Matches the option label potentially wrapped in brackets, preceded by optional list markers
      // (e.g., "- [Label]", "1. Label", "[Label]")
      // Added '.*' to the end to catch trailing punctuation or spaces that LLM sometimes adds.
      const lineRegex = new RegExp(`^\\s*([-ー•*]|\\d+[.\\)])?\\s*\\[?${escapedOpt}\\]?.*$`, 'gm');
      displayContent = displayContent.replace(lineRegex, '');

      // Fallback for horizontal options or mixed cases: remove keyword itself
      const keywordRegex = new RegExp(`\\[?${escapedOpt}\\]?`, 'g');
      displayContent = displayContent.replace(keywordRegex, '');
    });

    // Final cleanup of empty brackets, orphaned markers, and excessive newlines
    displayContent = displayContent.replace(/^\s*[-ー•*.]\s*$/gm, '');
    displayContent = displayContent.replace(/\[\s*\]/g, '');
    displayContent = displayContent.replace(/\n{3,}/g, '\n\n');
    displayContent = displayContent.trim();
  }

  // --- Multi-select detection ---
  // If not explicitly set by backend, try to guess from keywords
  if (typeof isMultiSelect === 'undefined' || isMultiSelect === null) {
    const multiKeywords = ["複数", "すべて", "全部", "複数回答", "複数選択", "どれか", "いくつか", "お選び"];
    isMultiSelect = multiKeywords.some(k => content.includes(k));
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  // Simple markdown-to-html for bold and newlines
  const formattedContent = displayContent
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  contentDiv.innerHTML = formattedContent;

  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'message-timestamp';
  timestampDiv.textContent = getCurrentTime();

  messageBody.appendChild(contentDiv);
  messageBody.appendChild(timestampDiv);

  messageDiv.appendChild(iconDiv);
  messageDiv.appendChild(messageBody);

  return messageDiv;
}

/**
 * Create options element
 */
function createOptionsElement(options, isMultiSelect = false) {
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'message-options';
  if (isMultiSelect) optionsDiv.classList.add('multi-select');

  options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.textContent = option.label;

    if (option.value === 'other' || option.label.includes('その他')) {
      button.classList.add('other-btn');
    }

    button.addEventListener('click', () => handleOptionClick(option, button, isMultiSelect));
    optionsDiv.appendChild(button);
  });

  if (isMultiSelect) {
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary btn-sm btn-confirm';
    confirmBtn.textContent = '選択を確定する';
    confirmBtn.addEventListener('click', () => handleMultiSelectConfirm(optionsDiv));
    optionsDiv.appendChild(confirmBtn);
  }

  return optionsDiv;
}

/**
 * Show loading indicator
 */
function showLoading() {
  // スピナー表示はUI安定性のため廃止
  // loading.style.display = 'flex';
  sendBtn.disabled = true;
  userInput.disabled = true;
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  // スピナー非表示はUI安定性のため廃止
  // loading.style.display = 'none';
  updateInputLock();
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
 * Handle session reset
 */
async function handleReset() {
  if (state.isWaitingForResponse) return;

  if (!confirm('全ての会話履歴が削除されます。最初からやり直しますか？')) {
    return;
  }

  // If we have a sessionId, try to delete it on the server
  if (state.sessionId) {
    const baseUrl = API_ENDPOINT.substring(0, API_ENDPOINT.lastIndexOf('/'));
    try {
      await fetch(`${baseUrl}/sessions/${state.sessionId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('Failed to delete session on server:', error);
    }
  }

  // Reset UI
  chatTimeline.innerHTML = '';
  downloadArea.style.display = 'none';
  userInput.value = '';

  // Reset State
  state.sessionId = null;
  state.conversationHistory = [];
  state.isComplete = false;
  state.finalMarkdown = null;
  state.isWaitingForResponse = false;
  state.gate.stage = 'gate1';
  state.gate.devType = null;
  state.gate.method = null;
  state.gate.nfrs = [];

  // Re-initialize
  initializeChat();
}

function updateInputLock() {
  const isLocked = state.gate.stage !== 'open';
  sendBtn.disabled = isLocked || state.isWaitingForResponse;
  userInput.disabled = isLocked || state.isWaitingForResponse;
  if (isLocked) {
    userInput.placeholder = 'Gate 1〜3の選択を完了してください';
  } else {
    userInput.placeholder = 'メッセージを入力...';
    userInput.focus();
  }
}

async function handleGate1Selection(option, buttonElement) {
  const optionsContainer = buttonElement.parentElement;
  const allButtons = optionsContainer.querySelectorAll('.option-btn');
  allButtons.forEach(btn => btn.disabled = true);

  addUserMessage(option.label);
  state.gate.devType = option.value;

  const methodSelection = METHOD_BY_DEVTYPE[option.value];
  state.gate.method = methodSelection ? methodSelection.value : null;

  addAIMessage(`Gate 2（手法の仮決定）: ${methodSelection.label} を採用します。バックエンドへ通知しました。`);
  if (methodSelection) {
    try {
      await sendMessageToAPI(methodSelection.label, methodSelection.value, { suppressAssistant: true });
    } catch (error) {
      addAIMessage('手法の通知に失敗しましたが、Gate 3 へ進みます。');
    }
  }

  state.gate.stage = 'gate3';
  addAIMessage('Gate 3（非機能要件）: 複数選択してください（複数選択）。', NFR_OPTIONS);
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
