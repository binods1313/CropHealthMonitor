
const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple fetch implementation for Node (if fetch not available) or using built-in fetch
const fetchUrl = async (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data); // Return text if not JSON
                    }
                } else {
                    reject({ status: res.statusCode, data: data });
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
};

// Load Env
const envPath = path.join(__dirname, '..', '.env');
let env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });
} else {
    console.error("❌ .env file not found!");
    process.exit(1);
}

const checkGemini = async () => {
    const key = env['VITE_GEMINI_API_KEY'] || env['GEMINI_API_KEY'];
    if (!key) return { success: false, msg: "Key Missing" };
    try {
        await fetchUrl(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        return { success: true };
    } catch (e) {
        return { success: false, msg: e.data || e.message };
    }
};

const checkOpenWeather = async () => {
    const key = env['VITE_OPENWEATHER_API_KEY'];
    if (!key) return { success: false, msg: "Key Missing" };
    try {
        await fetchUrl(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${key}`);
        return { success: true };
    } catch (e) {
        return { success: false, msg: e.data || e.message };
    }
};

const checkMapbox = async () => {
    const key = env['VITE_MAPBOX_API_KEY'];
    if (!key) return { success: false, msg: "Key Missing" };
    try {
        await fetchUrl(`https://api.mapbox.com/geocoding/v5/mapbox.places/Los%20Angeles.json?access_token=${key}`);
        return { success: true };
    } catch (e) {
        return { success: false, msg: e.data || e.message };
    }
};

const checkPerplexity = async () => {
    const key = env['VITE_PERPLEXITY_API_KEY'] || env['PERPLEXITY_API_KEY'];
    if (!key) return { success: false, msg: "Key Missing" };

    // Perplexity requires a POST
    try {
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [{ role: 'user', content: 'Test' }]
            })
        };
        // Note: fetchUrl above handles simple GET string URLs, need to adapt for options object with URL
        // Re-implementing specific call here for simplicity or adapting fetchUrl?
        // Let's just use the fetch global if available (Node 18+)
        if (typeof fetch !== 'undefined') {
            const res = await fetch('https://api.perplexity.ai/chat/completions', options);
            if (res.ok) return { success: true };
            const txt = await res.text();
            return { success: false, msg: `${res.status} ${txt}` };
        } else {
            return { success: false, msg: "Node environment too old for fetch" };
        }
    } catch (e) {
        return { success: false, msg: e.message };
    }
};

const run = async () => {
    console.log("🔧 validating APIs...");

    // Gemini
    const gemini = await checkGemini();
    console.log(`GEMINI_API_KEY: ${gemini.success ? '✅ Active' : '❌ Failed (' + gemini.msg + ')'}`);

    // OpenWeather
    const weather = await checkOpenWeather();
    console.log(`OPENWEATHER_API_KEY: ${weather.success ? '✅ Active' : '❌ Failed (' + weather.msg + ')'}`);

    // Mapbox
    const mapbox = await checkMapbox();
    console.log(`MAPBOX_API_KEY: ${mapbox.success ? '✅ Active' : '❌ Failed (' + mapbox.msg + ')'}`);

    // NASA (Unused check)
    const nasaKey = env['VITE_NASA_API_KEY'];
    console.log(`NASA_API_KEY: ${nasaKey ? '⚠️ Present but Unused in Codebase' : '❌ Missing'}`);

    // Perplexity
    const perplexity = await checkPerplexity();
    console.log(`PERPLEXITY_API_KEY: ${perplexity.success ? '✅ Active' : '❌ Failed (' + perplexity.msg + ')'}`);

};

run();
