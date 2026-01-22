/*
Universal CORS Proxy

This worker is used to proxy requests to the target URL and add CORS headers to the response.

Usage:
https://your-worker.workers.dev/?url=https://api.example.com/endpoint

Example:
https://cdn.corsfix.workers.dev/?url=https://api.example.com/endpoint
*/

export default {
    async fetch(request) {
        // Configure allowed origins - add your domains here
        const ALLOWED_ORIGINS = [
            // "*", // Allow all origins (remove this for security)
            "http://localhost:3000", // For local development
        ];

        // Handle OPTIONS preflight immediately
        if (request.method === "OPTIONS") {
            const requestOrigin = request.headers.get("Origin");

            // Fast origin check
            const isAllowed =
                !requestOrigin || ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(requestOrigin);

            if (!isAllowed) {
                return new Response(null, { status: 403 });
            }

            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes("*") ? "*" : requestOrigin,
                    "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,DELETE,PATCH,OPTIONS",
                    "Access-Control-Allow-Headers":
                        request.headers.get("Access-Control-Request-Headers") || "Content-Type,Authorization",
                    "Access-Control-Max-Age": "86400",
                },
            });
        }

        const url = new URL(request.url);
        const targetUrl = url.searchParams.get("url");

        // Show demo page if no URL parameter
        if (!targetUrl) {
            return new Response(DEMO_HTML, {
                headers: { "content-type": "text/html;charset=UTF-8" },
            });
        }

        const requestOrigin = request.headers.get("Origin");

        // Fast origin check
        const isAllowed = !requestOrigin || ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(requestOrigin);

        if (!isAllowed) {
            return new Response("Origin not allowed", { status: 403 });
        }

        try {
            // Create proxy request with minimal header manipulation
            const proxyRequest = new Request(targetUrl, {
                method: request.method,
                headers: request.headers,
                body: request.body,
                redirect: "follow",
            });

            // Only modify essential headers
            proxyRequest.headers.delete("host");

            // Fetch from upstream
            const response = await fetch(proxyRequest);

            // Clone headers and remove CORS headers in one pass
            const headers = new Headers(response.headers);
            headers.delete("Access-Control-Allow-Origin");
            headers.delete("Access-Control-Allow-Methods");
            headers.delete("Access-Control-Allow-Headers");
            headers.delete("Access-Control-Allow-Credentials");
            headers.delete("Access-Control-Expose-Headers");
            headers.delete("Access-Control-Max-Age");

            // Set our CORS headers
            const allowOrigin = ALLOWED_ORIGINS.includes("*") ? "*" : requestOrigin;
            headers.set("Access-Control-Allow-Origin", allowOrigin);
            headers.set("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,DELETE,PATCH,OPTIONS");
            headers.set("Vary", "Origin");

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers,
            });
        } catch (error) {
            return new Response(`Proxy error: ${error.message}`, {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes("*") ? "*" : requestOrigin,
                },
            });
        }
    },
};

const DEMO_HTML = `<!DOCTYPE html>
      <html>
      <head>
      <title>Universal CORS Proxy</title>
      <style>
      body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}
      code{background:#f4f4f4;padding:10px;display:block;margin:10px 0}
      .status{font-weight:bold}
      .error{color:red}
      .success{color:green}
      </style>
      </head>
      <body>
      <h1>Universal CORS Proxy</h1>
      <p>Make cross-origin requests to any API.</p>
      <h2>Usage</h2>
      <code>https://your-worker.workers.dev/?url=https://api.example.com/endpoint</code>
      <h2>Test</h2>
      <input type="url" id="u" placeholder="API URL" style="width:400px;padding:5px">
      <button onclick="t()">GET</button>
      <button onclick="p()">POST</button>
      <h3>Result:</h3>
      <p class="status" id="s">Ready</p>
      <code id="r">No requests made</code>
      <script>
      async function t(){const u=document.getElementById('u').value,s=document.getElementById('s'),r=document.getElementById('r');if(!u){s.textContent='Enter URL';s.className='status error';return}try{s.textContent='Loading...';s.className='status';const x=await fetch(location.origin+'/?url='+encodeURIComponent(u)),d=await x.text();s.textContent='Success: '+x.status;s.className='status success';r.textContent=d}catch(e){s.textContent='Error: '+e.message;s.className='status error';r.textContent=e}}
      async function p(){const u=document.getElementById('u').value,s=document.getElementById('s'),r=document.getElementById('r');if(!u){s.textContent='Enter URL';s.className='status error';return}try{s.textContent='Loading...';s.className='status';const x=await fetch(location.origin+'/?url='+encodeURIComponent(u),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({msg:'Hello',ts:Date.now()})}),d=await x.text();s.textContent='Success: '+x.status;s.className='status success';r.textContent=d}catch(e){s.textContent='Error: '+e.message;s.className='status error';r.textContent=e}}
      </script>
      </body>
      </html>`;
