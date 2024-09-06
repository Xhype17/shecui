import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

// 🔥🔥 FILL THIS OUT FIRST! 🔥🔥
// Get your Gemini API key by:
// - Selecting "Add Gemini API" in the "Project IDX" panel in the sidebar
// - Or by visiting https://g.co/ai/idxGetGeminiKey
let API_KEY = 'AIzaSyDy49_FwSwgLbk-G-EgMpOuBYY1KszyVmg';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let chatHistory = document.querySelector('.chat-history');

// Array untuk menyimpan riwayat percakapan
let conversationHistory = [];

form.onsubmit = async (ev) => {
  ev.preventDefault();

  // Ambil input pengguna
  let userMessage = promptInput.value;
  
  // Tambahkan pesan pengguna ke riwayat dan tampilkan
  conversationHistory.push({ role: 'user', text: userMessage });
  updateChatHistory();

  // Reset input setelah pesan dikirim
  promptInput.value = '';
  
  // Tampilkan "Generating..." sebagai placeholder saat menunggu respons
  conversationHistory.push({ role: 'bot', text: 'Generating...' });
  updateChatHistory();

  try {
    // Buat prompt hanya dengan teks
    let contents = [
      {
        role: 'user',
        parts: [
          { text: userMessage }
        ]
      }
    ];

    // Panggil API Gemini dan stream hasilnya
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents });

    // Hapus placeholder dan tambahkan respons asli ke riwayat
    conversationHistory.pop();  // Hapus "Generating..." placeholder
    let botResponse = '';
    for await (let response of result.stream) {
      botResponse += response.text();
    }

    conversationHistory.push({ role: 'bot', text: botResponse });
    updateChatHistory();
  } catch (e) {
    conversationHistory.push({ role: 'bot', text: 'Error: ' + e.message });
    updateChatHistory();
  }
};

// Fungsi untuk memperbarui tampilan riwayat chat
function updateChatHistory() {
  chatHistory.innerHTML = '';  // Kosongkan riwayat lama
  conversationHistory.forEach(entry => {
    let chatEntryDiv = document.createElement('div');
    chatEntryDiv.classList.add('chat-entry');
    chatEntryDiv.classList.add(entry.role === 'user' ? 'user' : 'bot');
    chatEntryDiv.textContent = (entry.role === 'user' ? 'You: ' : 'Bot: ') + entry.text;
    chatHistory.appendChild(chatEntryDiv);
  });

  // Scroll otomatis ke bawah
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Tampilkan banner untuk API Key jika perlu
maybeShowApiKeyBanner(API_KEY);
