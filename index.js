const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const PAGE_URL = "https://ufone-claim-new.vercel.app";
const API_URL = "https://ufone-claim.vercel.app/api/generate-otp";
const DEFAULT_USER_AGENT = "Mozilla/5.0 (Linux; Android 11; NEW 20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36";

// Minimal stealth script for navigator spoofing
const INIT_SCRIPT = `
Object.defineProperty(navigator, 'webdriver', { get: () => false });
Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });
Object.defineProperty(navigator, 'plugins', { get: () => [{name:'Chrome PDF Plugin'},{name:'Chrome PDF Viewer'}] });
if (!navigator.hardwareConcurrency) Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
if (!navigator.deviceMemory) Object.defineProperty(navigator, 'deviceMemory', { get: () => 4 });
try { const orig = Function.prototype.toString;
Function.prototype.toString = function() {
if (this === window.chrome?.runtime) return 'function runtime() { [native code] }';
return orig.call(this);
}; } catch(e){}
try { const getParameter = WebGLRenderingContext.prototype.getParameter;
WebGLRenderingContext.prototype.getParameter = function(parameter) {
if (parameter === 37445) return "Intel Inc.";
if (parameter === 37446) return "Intel Iris OpenGL Engine";
return getParameter.call(this, parameter);
}; } catch(e){}
`;

// Helper function to launch browser and get token
async function getCaptchaToken(headless=true) {
  let playwright;
  try {
    playwright = require('playwright');
  } catch(err) {
    return {ok:false, error:'playwright_not_installed', message: err.message};
  }

  try {
    const browser = await playwright.chromium.launch({headless});
    const context = await browser.newContext({
      userAgent: DEFAULT_USER_AGENT,
      viewport: {width: 390, height: 844},
      locale: 'en-US'
    });
    await context.addInitScript(INIT_SCRIPT);
    const page = await context.newPage();
    await page.goto(PAGE_URL, {waitUntil:'domcontentloaded', timeout:30000});

    // optional small human interactions
    try { await page.mouse.move(100,100); await page.mouse.move(110,105); } catch(e){}

    let token = null;
    try {
      token = await page.evaluate("typeof window.$B === 'function' ? window.$B() : (typeof $B === 'function' ? $B() : null);");
    } catch(e){}
    if (!token) {
      try { token = await page.evaluate("window.__CAPTCHA_TOKEN__ || window.captchaToken || null"); } catch(e){}
    }
    if (!token) {
      await browser.close();
      return {ok:false, error:'token_not_generated', message:'Captcha token not generated'};
    }
    const cookies = await context.cookies();
    await browser.close();
    return {ok:true, token, cookies};
  } catch(err) {
    return {ok:false, error:'playwright_runtime_error', message: err.message};
  }
}

// Helper function to call OTP API with token + cookies
async function callOtpApi(phone, deviceId, token, cookies=[]) {
  const headers = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Origin": "https://ufone-claim-new.vercel.app",
    "Referer": "https://ufone-claim-new.vercel.app/",
    "User-Agent": DEFAULT_USER_AGENT,
    "x-captcha-token": token
  };

  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  if(cookieHeader) headers['Cookie'] = cookieHeader;

  const payload = {phoneNumber: phone, deviceId};

  try {
    const res = await fetch(API_URL, {method:'POST', headers, body: JSON.stringify(payload)});
    const json = await res.json().catch(()=>({raw_text: 'non-json response'}));
    return {status: res.status, response: json};
  } catch(err) {
    return {error:'otp_request_failed', message: err.message};
  }
}

// Routes

app.get("/", (req,res) => {
  res.send(`
  <h3>Generate OTP</h3>
  <form id="f">
    <label>Phone: <input name="phoneNumber" id="phone" required></label><br>
    <label>Device ID: <input name="deviceId" id="device" value="dev1234"></label><br>
    <label>Headless: <select id="headless"><option value="1">true</option><option value="0">false</option></select></label><br>
    <button type="submit">Generate OTP</button>
  </form>
  <pre id="out"></pre>
  <script>
    const form = document.getElementById('f');
    const out = document.getElementById('out');
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      out.textContent = "Requesting...";
      const phone = document.getElementById('phone').value;
      const device = document.getElementById('device').value;
      const headless = document.getElementById('headless').value;
      const resp = await fetch('/generate-otp?phoneNumber='+encodeURIComponent(phone)+'&deviceId='+encodeURIComponent(device)+'&headless='+encodeURIComponent(headless));
      out.textContent = await resp.text();
    });
  </script>
  `);
});

app.get("/generate-otp", async (req,res)=>{
  const phone = req.query.phoneNumber;
  const deviceId = req.query.deviceId;
  const headless = req.query.headless !== "0" && req.query.headless !== "false";
  if(!phone || !deviceId) return res.status(400).json({error:'missing_parameters'});

  const tokenResult = await getCaptchaToken(headless);
  if(!tokenResult.ok) return res.status(422).json(tokenResult);

  const apiResult = await callOtpApi(phone, deviceId, tokenResult.token, tokenResult.cookies || []);
  res.status(apiResult.status || 200).json(apiResult.response || apiResult);
});

app.post("/generate-otp", async (req,res)=>{
  const {phoneNumber: phone, deviceId, headless=true} = req.body;
  if(!phone || !deviceId) return res.status(400).json({error:'missing_parameters'});

  const tokenResult = await getCaptchaToken(headless);
  if(!tokenResult.ok) return res.status(422).json(tokenResult);

  const apiResult = await callOtpApi(phone, deviceId, tokenResult.token, tokenResult.cookies || []);
  res.status(apiResult.status || 200).json(apiResult.response || apiResult);
});

// Listen for local dev (Vercel ignores this)
const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`Server running on port ${port}`));
