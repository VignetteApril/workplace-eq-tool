// api/mood.js
export default async function handler(req, res) {
    try {
        // 调用免费的 Hitokoto 接口
        const response = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k'); // c参数代表分类：职场、文学等
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ hitokoto: '今天也是充满希望的一天！', from: '系统' });
    }
}