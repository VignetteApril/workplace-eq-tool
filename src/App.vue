<script setup>
import { ref, onMounted } from 'vue'

// --- 原有的逻辑 ---
const userInput = ref('')
const result = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const remainingCount = ref(10)

// --- 新增：天气和心情状态 ---
const weather = ref(null)
const moodQuote = ref(null)

// 检查额度逻辑 (保持不变)
const checkDailyLimit = () => {
  const today = new Date().toLocaleDateString();
  const lastDate = localStorage.getItem('usage_date');
  let count = parseInt(localStorage.getItem('usage_count') || '0');
  if (lastDate !== today) {
    count = 0;
    localStorage.setItem('usage_date', today);
    localStorage.setItem('usage_count', '0');
  }
  remainingCount.value = Math.max(0, 10 - count);
  return count < 10;
}

// 核心：初始化加载
onMounted(async () => {
  checkDailyLimit();

  // 1. 获取天气
  try {
    const wRes = await fetch('/api/weather');
    if (wRes.ok) weather.value = await wRes.json();
  } catch (e) { console.error('天气加载失败', e) }

  // 2. 获取心情语录
  try {
    const mRes = await fetch('/api/mood');
    if (mRes.ok) moodQuote.value = await mRes.json();
  } catch (e) { console.error('语录加载失败', e) }
})

// 生成回复逻辑 (保持不变)
const generateReply = async () => {
  if (!userInput.value) { errorMsg.value = '请输入内容'; return; }
  if (!checkDailyLimit()) { errorMsg.value = '今日额度已用完'; return; }

  isLoading.value = true;
  errorMsg.value = '';
  result.value = '';

  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "你是一位职场沟通专家。将用户的直白话语转换为委婉、专业的职场用语。直接输出结果。" },
          { role: "user", content: userInput.value }
        ]
      })
    });
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      result.value = data.choices[0].message.content;
      let count = parseInt(localStorage.getItem('usage_count') || '0');
      count++;
      localStorage.setItem('usage_count', count.toString());
      checkDailyLimit();
    } else { throw new Error('服务繁忙'); }
  } catch (err) { errorMsg.value = '请求失败: ' + err.message; } finally { isLoading.value = false; }
}

const copyToClipboard = () => {
  if(result.value) { navigator.clipboard.writeText(result.value); alert('已复制！'); }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

      <div class="bg-blue-600 p-6 text-white relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full blur-2xl opacity-50"></div>

        <div class="relative z-10 text-center">
          <h1 class="text-2xl font-bold tracking-wider mb-2">职场嘴替生成器</h1>

          <div class="flex justify-center items-center gap-4 text-xs bg-blue-700/50 py-1.5 px-3 rounded-full mx-auto w-fit backdrop-blur-sm">
            <span v-if="weather" class="flex items-center gap-1">
              <span>📍北京</span>
              <span>{{ weather.text }}</span>
              <span>{{ weather.temp }}°C</span>
            </span>
            <span v-else>☁️ 获取天气中...</span>

            <span class="w-px h-3 bg-blue-300/50"></span>

            <span>剩余次数 {{ remainingCount }}</span>
          </div>

          <p v-if="moodQuote" class="mt-4 text-blue-100 text-xs italic font-light">
            "{{ moodQuote.hitokoto }}"
          </p>
        </div>
      </div>

      <div class="p-6 space-y-5">

        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">输入大白话</label>
          <div class="relative">
            <textarea
              v-model="userInput"
              rows="4"
              placeholder="例如：这需求做不了，别来烦我..."
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all text-gray-700 placeholder-gray-400"
            ></textarea>
          </div>
        </div>

        <button
          @click="generateReply"
          :disabled="isLoading || remainingCount <= 0"
          :class="[
            'w-full py-3.5 text-white font-semibold rounded-xl transition-all shadow-lg flex justify-center items-center transform active:scale-95',
            remainingCount > 0 ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-200' : 'bg-gray-300 cursor-not-allowed shadow-none'
          ]"
        >
          <span v-if="isLoading" class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            AI 正在疯狂斟酌...
          </span>
          <span v-else-if="remainingCount <= 0">明日再来 👋</span>
          <span v-else>✨ 转换成高情商回复</span>
        </button>

        <div v-if="errorMsg" class="text-red-500 text-xs bg-red-50 p-3 rounded-lg text-center border border-red-100">
          {{ errorMsg }}
        </div>

        <div v-if="result" class="bg-green-50 border border-green-200 rounded-2xl p-5 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex justify-between items-center mb-3">
            <span class="text-xs font-bold text-green-700 uppercase tracking-wide bg-green-100 px-2 py-0.5 rounded">建议回复</span>
            <button @click="copyToClipboard" class="text-xs text-green-700 font-bold hover:text-green-800 flex items-center gap-1 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              复制
            </button>
          </div>
          <p class="text-gray-800 text-base leading-relaxed">{{ result }}</p>
        </div>

      </div>
    </div>
  </div>
</template>