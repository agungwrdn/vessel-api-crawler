try { require('dotenv').config() } catch { /* Environment variables may be injected by the process manager. */ }

const axios = require('axios')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const API_URL = process.env.LANCAR_GPS_API_URL || 'https://shipmanagement-iksn.com/api/partner/v1/gps'
const ESN = process.env.LANCAR_GPS_ESN || '4585161'
const INTERVAL_MS = Number(process.env.LANCAR_GPS_INTERVAL_MS || 6 * 60 * 60 * 1000)

function parseEsns(value = process.env.LANCAR_GPS_ESNS || ESN) {
  return String(value).split(',').map((esn) => esn.trim()).filter(Boolean)
}

function normalizePosition(payload, fallbackEsn = ESN) {
  const item = payload && Array.isArray(payload.data) && payload.data[0]
  if (!item || item.latitude == null || item.longitude == null || !Number.isFinite(Number(item.latitude)) || !Number.isFinite(Number(item.longitude))) {
    throw new Error('Lancar GPS response tidak berisi posisi yang valid')
  }
  const timestamp = item.datereported
  if (!timestamp || Number.isNaN(new Date(timestamp).getTime())) throw new Error('Lancar GPS response tidak berisi waktu yang valid')
  return {
    esn: String(item.esnid || fallbackEsn), name: item.vessel_name || null,
    latitude: Number(item.latitude), longitude: Number(item.longitude),
    speed: item.speed == null ? null : Number(item.speed), heading: item.direct == null ? null : Number(item.direct), timestamp,
  }
}

async function fetchPosition({ esn = ESN, apiKey = process.env.LANCAR_GPS_API_KEY, http = axios } = {}) {
  if (!apiKey) throw new Error('LANCAR_GPS_API_KEY belum diisi')
  const response = await http.get(`${API_URL}/getlastposition`, { params: { esn }, headers: { 'X-API-Key': apiKey }, timeout: 30_000 })
  return normalizePosition(response.data, esn)
}

async function savePosition(position, client = prisma) {
  const gpsTime = new Date(position.timestamp)
  await client.device_gps.upsert({ where: { id: position.esn }, update: { keterangan: 'Lancar Berkat Prima GPS API', nama_kapal: position.name }, create: { id: position.esn, keterangan: 'Lancar Berkat Prima GPS API', nama_kapal: position.name } })
  return client.device_gpsHits.create({ data: { ObjectID: position.esn, Lat: position.latitude, Lon: position.longitude, Speed: position.speed, GPSTime: gpsTime, LastDataTime: gpsTime } })
}

async function runOnce({ esns = parseEsns(), apiKey, http = axios, client = prisma } = {}) {
  const positions = []
  for (const esn of esns) {
    try {
      const position = await fetchPosition({ esn, apiKey, http })
      await savePosition(position, client)
      console.log(`[LancarGPS] ${position.esn} ${position.latitude},${position.longitude}`)
      positions.push(position)
    } catch (error) {
      console.error(`[LancarGPS] ${esn} gagal:`, error.message)
    }
  }
  return positions
}

function start(intervalMs = INTERVAL_MS) {
  let running = false
  const execute = async () => { if (running) return; running = true; try { await runOnce() } finally { running = false } }
  execute()
  return setInterval(execute, intervalMs)
}

if (require.main === module) start()

module.exports = { fetchPosition, normalizePosition, parseEsns, runOnce, savePosition, start }
