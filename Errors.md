PS E:\Agentic AIs\V3 CropHealthMonitor> npm run dev

> crophealth-monitor@0.0.0 dev
> vite


  VITE v6.4.1  ready in 23875 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.56.1:3000/
  ➜  Network: http://192.168.1.3:3000/
  ➜  press h + enter to show help
[API Request] POST /api/analyze
[AI] Checking model: gemini-1.5-flash...
[AI] gemini-1.5-flash failed: model.generateContent is not a function
[AI] Checking model: gemini-1.5-pro...
[AI] gemini-1.5-pro failed: model.generateContent is not a function
[AI] Checking model: gemini-2.0-flash-exp...
[AI] gemini-2.0-flash-exp failed: model.generateContent is not a function
[AI] Checking model: gemini-1.5-flash-latest...
[AI] gemini-1.5-flash-latest failed: model.generateContent is not a function
[AI] Checking model: gemini-pro-vision...
[AI] gemini-pro-vision failed: model.generateContent is not a function
[AI Fallback] All Gemini models failed or over-quota. Providing smart mock data.      
file:///E:/Agentic%20AIs/V3%20CropHealthMonitor/node_modules/@google/genai/dist/node/index.mjs:82
        if (Object.prototype.hasOwnProperty.call(valueMap, key)) {
                                            ^

TypeError: Cannot convert undefined or null to object
    at hasOwnProperty (<anonymous>)
    at file:///E:/Agentic%20AIs/V3%20CropHealthMonitor/node_modules/@google/genai/dist/node/index.mjs:82:45
    at String.replace (<anonymous>)
    at formatMap (file:///E:/Agentic%20AIs/V3%20CropHealthMonitor/node_modules/@google/genai/dist/node/index.mjs:81:27)
    at Models.get (file:///E:/Agentic%20AIs/V3%20CropHealthMonitor/node_modules/@google/genai/dist/node/index.mjs:14105:20)
    at runAnalyzeFarmHealth (eval at runInlinedModule (file:///E:/Agentic%20AIs/V3%20CropHealthMonitor/node_modules/vite/dist/node/module-runner.js:1062:11), <anonymous>:44:31)
    at handler (eval at runInlinedModule (file:///E:/Agentic%20AIs/V3%20CropHealthMonitor/node_modules/vite/dist/node/module-runner.js:1062:11), <anonymous>:31:82)
    at file:///E:/Agentic%20AIs/V3%20CropHealthMonitor/node_modules/.vite-temp/vite.config.ts.timestamp-1767309776017-1dfd22c3cb903.mjs:60:25

Node.js v22.19.0
PS E:\Agentic AIs\V3 CropHealthMonitor> 

and console-
generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent:1   Failed to load resource: the server responded with a status of 403 ()
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
waitForSuccessfulPing @ client:1060
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
waitForSuccessfulPing @ client:1060
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
waitForSuccessfulPing @ client:1060
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
waitForSuccessfulPing @ client:1060
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
waitForSuccessfulPing @ client:1060
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
waitForSuccessfulPing @ client:1060
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 
ping @ client:1035
waitForSuccessfulPing @ client:1060
client:1035  WebSocket connection to 'ws://localhost:3000/' failed: 