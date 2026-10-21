import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  const headersList = await headers()
  
  // 1. Ambil IP asli pengunjung dari header Vercel
  const forwardedFor = headersList.get('x-forwarded-for')
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : ''
  
  // Jika diakses lokal atau IP kosong, gunakan placeholder atau IP publik untuk testing
  const ipQuery = clientIp && clientIp !== '127.0.0.1' ? clientIp : ''

  let locationData = {
    city: headersList.get('x-vercel-ip-city') || 'Unknown City',
    country: headersList.get('x-vercel-ip-country') || 'Unknown Country',
    isp: 'Unknown ISP',
    zip: '00000'
  }

  try {
    // 2. Lacak detail tambahan (ISP & ZIP) menggunakan ip-api.com
    const response = await fetch(`http://ip-api.com/json/${ipQuery}?fields=status,message,country,city,zip,isp,query`)
    const data = await response.json()

    if (data.status === 'success') {
      locationData = {
        city: data.city || locationData.city,
        country: data.country || locationData.country,
        isp: data.isp || 'Unknown ISP',
        zip: data.zip || 'Unknown ZIP'
      }
    }
  } catch (err) {
    console.error('Gagal mengambil data dari ip-api:', err)
  }

  // 3. Simpan ke tabel 'visitors' di Supabase beserta ISP dan ZIP
  const { error } = await supabase
    .from('visitors')
    .insert([
      { 
        ip_address: clientIp || '127.0.0.1', 
        city: decodeURIComponent(locationData.city), 
        country: locationData.country,
        isp: locationData.isp,
        zip: locationData.zip
      },
    ])

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({ 
    success: true, 
    message: 'Data pengunjung beserta ISP dan ZIP berhasil dicatat',
    data: { 
      clientIp: clientIp || '127.0.0.1', 
      ...locationData 
    }
  })
}
