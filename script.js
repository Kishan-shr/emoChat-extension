
// Gemini API Configuration
import { API_KEY } from "./config.js";
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Typing Indicator
const typingIndicator = document.createElement('div');
typingIndicator.classList.add('bot-message');
typingIndicator.innerHTML = `<img class="profile-image" src="bot01.png" alt="Bot"><div class="message-content"><em>Emo is typing<span id="dots">.</span></em></div>`;
typingIndicator.style.display = 'none';
// chatMessages.appendChild(typingIndicator);

// Typing Dots Animation
function startTypingDots() {
  const dotsSpan = typingIndicator.querySelector('#dots');
  let count = 1;
  return setInterval(() => {
    dotsSpan.textContent = '.'.repeat(count++ % 4 || 1);
  }, 400);
}

// Clean Markdown from Gemini Output
function cleanMarkdown(text) {
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Show or hide typing indicator
// function showTyping() {
//   typingIndicator.style.display = 'flex';
//   chatMessages.scrollTop = chatMessages.scrollHeight;
//   return startTypingDots();
// }
function showTyping() {
    chatMessages.appendChild(typingIndicator); // Append at the bottom when needed
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return startTypingDots();
  }
  

// function hideTyping(intervalId) {
//   clearInterval(intervalId);
//   typingIndicator.style.display = 'none';
// }
function hideTyping(intervalId) {
    clearInterval(intervalId);
    if (typingIndicator.parentNode) {
      typingIndicator.remove(); // Remove it from DOM to avoid duplicates
    }
  }
  
// Add message to chat
function addMessage(message, isUser, isTyping = false) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');

  const profileImage = document.createElement('img');
  profileImage.classList.add('profile-image');
  profileImage.src = isUser ? 'user.png' : 'bot01.png';
  profileImage.alt = isUser ? 'User' : 'Bot';

  const messageContent = document.createElement('div');
  messageContent.classList.add('message-content');

  messageElement.appendChild(profileImage);
  messageElement.appendChild(messageContent);
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (isTyping) {
    typeText(messageContent, message);
  } else {
    messageContent.textContent = message;
  }
}

// Typing animation
function typeText(element, text, speed = 25) {
  element.textContent = '';
  let index = 0;
  const interval = setInterval(() => {
    element.textContent += text[index++];
    if (index >= text.length) clearInterval(interval);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, speed);
}

// Send prompt to Gemini API
async function generateResponse(prompt) {
  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate response');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Handle user input
async function handleUserInput() {
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, true);
  userInput.value = '';
  userInput.disabled = true;
  sendButton.disabled = true;

  const typingInterval = showTyping();

  try {
    const botRaw = await generateResponse(userMessage);
    const botMessage = cleanMarkdown(botRaw);
    hideTyping(typingInterval);
    addMessage(botMessage, false, true);
  } catch (err) {
    console.error(err);
    hideTyping(typingInterval);
    addMessage("Oops! Something went wrong. Please try again.", false);
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

// Event Listeners
sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleUserInput();
  }
});
