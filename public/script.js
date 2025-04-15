// DOM Elements
const apiKeyInput = document.getElementById('api-key-input');
const submitKeyBtn = document.getElementById('submit-key');
const apiKeySection = document.getElementById('api-key-section');
const translationSection = document.getElementById('translation-section');
const sourceText = document.getElementById('source-text');
const translationResult = document.getElementById('translation-result');
const loadingIndicator = document.getElementById('loading-indicator');

// State
let apiKey = '';
let debounceTimer = null;
const DEBOUNCE_DELAY = 1000; // 1 second delay after typing stops

// Event Listeners
submitKeyBtn.addEventListener('click', handleApiKeySubmit);
sourceText.addEventListener('input', handleSourceTextInput);

// Functions
async function handleApiKeySubmit() {
    apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showError('Please enter a valid API key');
        return;
    }

    try {
        showLoading();
        const response = await fetch('/api/validate-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ apiKey })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Invalid API key');
        }

        apiKeySection.classList.add('hidden');
        translationSection.classList.remove('hidden');
        clearError();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function handleSourceTextInput() {
    // Clear previous debounce timer
    clearTimeout(debounceTimer);
    
    // Set new debounce timer
    debounceTimer = setTimeout(() => {
        const text = sourceText.value.trim();
        if (text && apiKey) {
            translateText(text);
        }
    }, DEBOUNCE_DELAY);
}

async function validateDeepSeekKey(key) {
    try {
        const testResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1
            })
        });
        return testResponse.ok;
    } catch {
        return false;
    }
}

async function translateText(text) {
    try {
        showLoading();
        clearError();
        
        if (!apiKey) {
            throw new Error('请先输入有效的API Key');
        }

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一名专业翻译，请将以下内容准确翻译成英文，保持正式和学术风格'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || '翻译失败，请检查API Key');
        }

        translationResult.textContent = data.choices[0].message.content;
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function handleApiKeySubmit() {
    apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showError('请输入API Key');
        return;
    }

    try {
        showLoading();
        const isValid = await validateDeepSeekKey(apiKey);
        
        if (!isValid) {
            throw new Error('无效的API Key');
        }

        apiKeySection.classList.add('hidden');
        translationSection.classList.remove('hidden');
        clearError();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function showLoading() {
    loadingIndicator.classList.remove('hidden');
    translationResult.textContent = '';
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

function showError(message) {
    // Remove any existing error message
    clearError();
    
    // Create and show new error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    if (apiKeySection.classList.contains('hidden')) {
        translationSection.insertBefore(errorElement, translationSection.firstChild);
    } else {
        apiKeySection.appendChild(errorElement);
    }
}

function clearError() {
    const errorElement = document.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}
