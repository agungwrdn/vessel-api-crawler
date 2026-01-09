const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const axios = require('axios')
const moment = require('moment')
const FormData = require('form-data')

async function main() {
  try {
    // bikin form-data sesuai curl
    const form = new FormData()
    form.append('key', 'ada4007488834935e42c5b1e7fc41948')

    const response = await axios.post(
      'https://vis.telkomsat.co.id/api/my_vessel',
      form,
      { headers: form.getHeaders() }
    )

    const rows = response.data.data // ambil array data langsung
    if (!Array.isArray(rows)) {
      console.error('Response tidak sesuai:', response.data)
      return
    }

    for (const item of rows) {
      try {
        const mssi = item.mmsi.toString()
        const timeGPS = moment(item.time_detected, "YYYY-MM-DD HH:mm:ss").toISOString()

        // Upsert ke device_gps
        await prisma.device_gps.upsert({
          where: { id: mssi },
          update: {
            keterangan: item.name,
            nama_kapal: item.name
          },
          create: {
            id: mssi,
            keterangan: item.name,
            nama_kapal: item.name
          }
        })

        // Insert ke device_gpsHits
        await prisma.device_gpsHits.create({
          data: {
            ObjectID: mssi,
            Lat: parseFloat(item.lat),
            Lon: parseFloat(item.lon),
            Speed: parseFloat(item.sog),
            GPSTime: timeGPS,
            LastDataTime: timeGPS
          }
        })

        console.log(`Saved data kapal: ${item.name}`)
      } catch (err) {
        console.error("DB Error:", err)
      }
    }

  } catch (err) {
    console.error('API Error:', err.message)
  }
}

// jalanin sekali
main()

// jalanin tiap 1 jam
setInterval(() => {
  console.log('Ambil GPS baru...')
  main()
}, 1 * 60 * 60 * 1000)
