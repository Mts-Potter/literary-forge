import fs from 'fs/promises'
import path from 'path'
import fetch from 'node-fetch'

export interface BookConfig {
  id: string
  title: string
  author: {
    name: string
    death_year: number
  }
  language: string
  publication_year: number
  cefr_level: string
  source: {
    type: 'standard_ebooks' | 'gutenberg'
    url: string
    epub_download_url?: string
    txt_download_url?: string
  }
  rights: {
    is_pd_us: boolean
    is_pd_eu: boolean
    verification_date: string
    us_rationale: string
    eu_rationale: string
  }
  tags: string[]
  lexile_score: number | null
}

export interface DownloadResult {
  success: boolean
  localPath?: string
  error?: string
}

export async function downloadBook(
  bookConfig: BookConfig
): Promise<DownloadResult> {
  const downloadDir = '/tmp/literary-forge/downloads'
  await fs.mkdir(downloadDir, { recursive: true })

  try {
    if (bookConfig.source.type === 'standard_ebooks') {
      return await downloadStandardEbook(bookConfig, downloadDir)
    } else if (bookConfig.source.type === 'gutenberg') {
      return await downloadGutenberg(bookConfig, downloadDir)
    } else {
      throw new Error(`Unknown source type: ${bookConfig.source.type}`)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function downloadStandardEbook(
  bookConfig: BookConfig,
  downloadDir: string
): Promise<DownloadResult> {
  const epubUrl = bookConfig.source.epub_download_url
  if (!epubUrl) {
    throw new Error('Missing epub_download_url for Standard Ebooks book')
  }

  const localPath = path.join(downloadDir, `${bookConfig.id}.epub`)

  console.log(`📥 Downloading ${bookConfig.title} from Standard Ebooks...`)
  console.log(`   URL: ${epubUrl}`)

  const response = await fetch(epubUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'LiteraryForge-BatchImport/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const buffer = await response.buffer()
  await fs.writeFile(localPath, buffer)

  console.log(`✅ Downloaded to ${localPath} (${buffer.length} bytes)`)

  return {
    success: true,
    localPath
  }
}

async function downloadGutenberg(
  bookConfig: BookConfig,
  downloadDir: string
): Promise<DownloadResult> {
  const txtUrl = bookConfig.source.txt_download_url
  if (!txtUrl) {
    throw new Error('Missing txt_download_url for Gutenberg book')
  }

  const localPath = path.join(downloadDir, `${bookConfig.id}.txt`)

  console.log(`📥 Downloading ${bookConfig.title} from Project Gutenberg...`)
  console.log(`   URL: ${txtUrl}`)

  const response = await fetch(txtUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'LiteraryForge-BatchImport/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const text = await response.text()

  // Force UTF-8 encoding
  await fs.writeFile(localPath, text, 'utf8')

  console.log(`✅ Downloaded to ${localPath} (${text.length} chars)`)

  return {
    success: true,
    localPath
  }
}
