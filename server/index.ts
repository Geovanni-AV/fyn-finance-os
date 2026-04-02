import express from 'express'
import cors from 'cors'
import multer from 'multer'
import dotenv from 'dotenv'
import path from 'path'
import fontPaths from 'pdf-parse/lib/pdf-java.js' // Fix for pdf-parse issue in some environments
import { processPdf } from './lib/pdf-processor.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

const upload = multer({ dest: 'uploads/' })

app.use(cors())
app.use(express.json())

app.post('/api/upload-bank-statement', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { bankId, accountId, userId } = req.body
    
    if (!bankId || !accountId || !userId) {
      return res.status(400).json({ error: 'bankId, accountId and userId are required' })
    }

    const result = await processPdf(req.file.path, bankId, accountId, userId)
    res.json(result)
  } catch (error) {
    console.error('Error processing PDF:', error)
    res.status(500).json({ error: 'Error processing PDF: ' + (error as Error).message })
  }
})

app.listen(port, () => {
  console.log(`FYN Server listening at http://localhost:${port}`)
})
