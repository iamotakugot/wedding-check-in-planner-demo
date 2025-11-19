// Minimal JSON DB API for local development
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

const dataDir = path.join(__dirname, 'data')
const inviteConfigPath = path.join(dataDir, 'invite-config.json')
const rsvpsPath = path.join(dataDir, 'rsvps.json')

function ensureFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(inviteConfigPath)) {
    fs.writeFileSync(inviteConfigPath, JSON.stringify({
      eventTitle: "Jane & Joe's Wedding",
      eventDate: '12 ธันวาคม 2025',
      venueName: 'แกรนด์บอลรูม',
      address: 'โรงแรมสุดหรู, กรุงเทพฯ',
      bannerImage: 'https://images.unsplash.com/photo-1519225468359-69df3ef39f67?q=80&w=1200&auto=format&fit=crop',
      bannerHeight: 220,
      bannerObjectFit: 'cover',
      youtubeUrl: '',
      musicVolume: 30,
      schedule: [
        { time: '07:09', title: 'พิธีสงฆ์', desc: 'เจริญพระพุทธมนต์' },
        { time: '09:09', title: 'พิธีขันหมาก', desc: 'ตั้งขบวนขันหมาก' },
        { time: '18:30', title: 'งานฉลองมงคลสมรส', desc: 'เริ่มงานเลี้ยงภาคค่ำ' },
      ],
    }, null, 2))
  }
  if (!fs.existsSync(rsvpsPath)) {
    fs.writeFileSync(rsvpsPath, JSON.stringify({}, null, 2))
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return null
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

ensureFiles()

app.use(cors())
app.use(express.json())

// Invite Config
app.get('/api/invite-config', (req, res) => {
  const data = readJson(inviteConfigPath)
  res.json(data || {})
})

app.put('/api/invite-config', (req, res) => {
  const payload = req.body || {}
  writeJson(inviteConfigPath, payload)
  res.json({ ok: true })
})

// RSVPs
app.get('/api/rsvps', (req, res) => {
  const data = readJson(rsvpsPath) || {}
  res.json(data)
})

app.get('/api/rsvps/:id', (req, res) => {
  const data = readJson(rsvpsPath) || {}
  const item = data[req.params.id] || null
  res.json(item)
})

app.post('/api/rsvps', (req, res) => {
  const { userId, data } = req.body || {}
  if (!userId || !data) return res.status(400).json({ error: 'userId and data required' })
  const db = readJson(rsvpsPath) || {}
  db[userId] = data
  writeJson(rsvpsPath, db)
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`JSON DB API running on http://localhost:${PORT}`)
})


