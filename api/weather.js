// api/weather.js
export default async function handler(req, res) {
    const apiKey = process.env.APP_QWEATHER_API_KEY;

    // 默认查询北京 (101010100)，实际项目中可以根据用户 IP 查
    // 想要查其他城市，需要先调用和风的城市搜索 API，这里为了作业简单直接写死
    const cityId = '101010100';

    try {
        const response = await fetch(`https://nt6apxa7yn.re.qweatherapi.com/v7/weather/now?location=${cityId}&key=${apiKey}&lang=zh`);
        const data = await response.json();

        if (data.code === '200') {
            res.status(200).json(data.now);
        } else {
            res.status(500).json({ error: '天气查询失败' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}