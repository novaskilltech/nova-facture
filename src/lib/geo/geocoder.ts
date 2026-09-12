import { prisma } from '@/lib/db'
import regionsData from './regions.json'

export interface GeocodeResult {
  latitude: number
  longitude: number
  city?: string
  postalCode?: string
  department?: string
  region?: string
  country?: string
}

const DEPT_TO_REGION: Record<string, { deptName: string; regionName: string }> = regionsData as any

export function deduceRegionFromPostalCode(postalCode?: string | null): { dept?: string; region?: string } {
  if (!postalCode) return {}
  const cleaned = postalCode.trim()
  if (cleaned.length < 2) return {}
  let deptKey = cleaned.substring(0, 2)
  if (cleaned.startsWith('20')) {
    const num = parseInt(cleaned, 10)
    deptKey = num < 20200 ? '2A' : '2B'
  }
  const found = DEPT_TO_REGION[deptKey]
  if (found) {
    return {
      dept: deptKey + ' - ' + found.deptName,
      region: found.regionName,
    }
  }
  return {}
}

export async function geocodeAddress(client: {
  id: string
  address?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
}): Promise<GeocodeResult | null> {
  const addressParts = [client.address, client.postalCode, client.city, client.country || 'France'].filter(Boolean)
  if (addressParts.length === 0 || (!client.city && !client.postalCode)) {
    return null
  }

  const isFrance = !client.country || client.country.toLowerCase().includes('france')
  if (isFrance) {
    try {
      const q = [client.address, client.postalCode, client.city].filter(Boolean).join(' ')
      const url = 'https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(q) + '&limit=1'
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (res.ok) {
        const data = await res.json()
        if (data.features && data.features.length > 0) {
          const feat = data.features[0]
          const [lon, lat] = feat.geometry.coordinates
          const props = feat.properties
          const postCode = props.postcode || client.postalCode || ''
          const deduced = deduceRegionFromPostalCode(postCode)

          return {
            latitude: lat,
            longitude: lon,
            city: props.city || client.city || undefined,
            postalCode: postCode,
            department: deduced.dept || (props.context ? props.context.split(',')[1]?.trim() : undefined),
            region: deduced.region || (props.context ? props.context.split(',')[2]?.trim() : undefined),
            country: 'France',
          }
        }
      }
    } catch {
      // Fallback OpenStreetMap
    }
  }

  try {
    const query = [client.address, client.postalCode, client.city, client.country || 'France'].filter(Boolean).join(', ')
    const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1&addressdetails=1'
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'NovaFacture/1.0 (contact@omrayanair.fr)',
        Accept: 'application/json',
      },
    })
    if (res.ok) {
      const results = await res.json()
      if (results && results.length > 0) {
        const item = results[0]
        const lat = parseFloat(item.lat)
        const lon = parseFloat(item.lon)
        const addr = item.address || {}
        const postCode = addr.postcode || client.postalCode || ''
        const deduced = deduceRegionFromPostalCode(postCode)

        return {
          latitude: lat,
          longitude: lon,
          city: addr.city || addr.town || addr.village || client.city || undefined,
          postalCode: postCode,
          department: deduced.dept || addr.county || undefined,
          region: deduced.region || addr.state || undefined,
          country: addr.country || client.country || 'France',
        }
      }
    }
  } catch {
    // Erreur externe
  }

  return null
}

export async function processBatchGeocoding(limit = 25) {
  const pendingClients = await prisma.client.findMany({
    where: {
      OR: [
        { geocodeStatus: 'PENDING' },
        { geocodeStatus: null },
        { latitude: null },
      ],
    },
    take: limit,
  })

  let updatedCount = 0
  let failedCount = 0

  for (const client of pendingClients) {
    if (!client.city && !client.postalCode && !client.address) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          geocodeStatus: 'FAILED',
          geocodeError: 'Adresse, ville et code postal manquants',
        },
      })
      failedCount++
      continue
    }

    const geo = await geocodeAddress(client)
    if (geo) {
      const deduced = deduceRegionFromPostalCode(geo.postalCode || client.postalCode)
      await prisma.client.update({
        where: { id: client.id },
        data: {
          latitude: geo.latitude,
          longitude: geo.longitude,
          city: geo.city || client.city,
          postalCode: geo.postalCode || client.postalCode,
          department: geo.department || deduced.dept || client.department,
          region: geo.region || deduced.region || client.region,
          country: geo.country || client.country || 'France',
          geocodeStatus: 'SUCCESS',
          geocodeError: null,
        },
      })
      updatedCount++
    } else {
      const deduced = deduceRegionFromPostalCode(client.postalCode)
      await prisma.client.update({
        where: { id: client.id },
        data: {
          region: client.region || deduced.region || null,
          department: client.department || deduced.dept || null,
          geocodeStatus: 'FAILED',
          geocodeError: 'Adresse introuvable ou coordonn�es GPS indisponibles',
        },
      })
      failedCount++
    }

    await new Promise((r) => setTimeout(r, 200))
  }

  return { total: pendingClients.length, updatedCount, failedCount }
}
