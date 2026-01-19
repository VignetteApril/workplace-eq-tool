// api/proxy.js
// 这是一个运行在 Vercel 服务器上的函数，用户看不到这里的代码
export default async function handler(req, res) {
    // 1. 获取你的 Key (从 Vercel 环境变量中读取，最安全)
    const API_KEY = process.env.SILICONFLOW_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Server Key Not Configured' });
    }

    // 2. 接收前端传来的消息
    const { messages } = req.body;

    try {
        // 3. 在服务端帮用户调用 SiliconFlow
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}` // Key 在这里被使用，用户看不见
            },
            body: JSON.stringify({
                model: "deepseek-ai/DeepSeek-V3",
                messages: messages,
                stream: false
            })
        });

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ error: 'API Error' });
    }
}