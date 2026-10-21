import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  const headersList = await headers()

  const forwardedFor = headersList.get('x-forwarded-for')
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'

  const city = headersList.get('x-vercel-ip-city') || 'Unknown City'
  const country = headersList.get('x-vercel-ip-country') || 'Unknown Country'

  const { data, error } = await supabase
    .from('visitors')
    .insert([
      { 
        ip_address: clientIp, 
        city: decodeURIComponent(city), 
        country: country 
      },
    ])

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({ 
    success: true, 
    message: 'Data pengunjung berhasil dicatat',
    data: { clientIp, city, country }
  })
}
