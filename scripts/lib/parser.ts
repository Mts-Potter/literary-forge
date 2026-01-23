import fs from 'fs/promises'
import EPub from 'epub'
import { promisify } from 'util'

export interface ParseResult {
  success: boolean
  text?: string
  error?: string
}

export async function parseBook(
  localPath: string,
  sourceType: 'standard_ebooks' | 'gutenberg'
): Promise<ParseResult> {
  try {
    if (sourceType === 'standard_ebooks') {
      return await parseEPUB(localPath)
    } else if (sourceType === 'gutenberg') {
      return await parseGutenbergTXT(localPath)
    } else {
      throw new Error(`Unknown source type: ${sourceType}`)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function parseEPUB(epubPath: string): Promise<ParseResult> {
  console.log(`📖 Parsing EPUB: ${epubPath}`)

  const epub = new EPub(epubPath)
  await promisify(epub.parse.bind(epub))()

  const chapters: string[] = []

  // Extract all chapters
  for (const chapter of epub.flow) {
    const chapterText = await promisify<string, string>(
      epub.getChapter.bind(epub)
    )(chapter.id)

    // Strip HTML tags
    const plainText = chapterText
      .replace(/<[^>]+>/g, ' ')  // Remove HTML tags
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim()

    if (plainText.length > 50) {
      chapters.push(plainText)
    }
  }

  const fullText = chapters.join('\n\n')

  console.log(`✅ Extracted ${chapters.length} chapters (${fullText.length} chars)`)

  return {
    success: true,
    text: fullText
  }
}

async function parseGutenbergTXT(txtPath: string): Promise<ParseResult> {
  console.log(`📖 Parsing Gutenberg TXT: ${txtPath}`)

  let text = await fs.readFile(txtPath, 'utf8')

  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1)
  }

  // Remove Gutenberg header
  const startMarkers = [
    /\*\*\* START OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i,
    /\*\*\* START OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/i
  ]

  for (const marker of startMarkers) {
    const match = text.match(marker)
    if (match) {
      const startIndex = match.index! + match[0].length
      text = text.slice(startIndex)
      console.log(`   ✂️  Stripped Gutenberg header (${startIndex} chars)`)
      break
    }
  }

  // Remove Gutenberg footer
  const endMarkers = [
    /\*\*\* END OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i,
    /\*\*\* END OF THE PROJECT GUTENBERG EBOOK .* \*\*\*/i
  ]

  for (const marker of endMarkers) {
    const match = text.match(marker)
    if (match) {
      text = text.slice(0, match.index)
      console.log(`   ✂️  Stripped Gutenberg footer`)
      break
    }
  }

  // Normalize whitespace
  text = text
    .replace(/\r\n/g, '\n')      // Windows line endings
    .replace(/\r/g, '\n')        // Mac line endings
    .replace(/\n{3,}/g, '\n\n')  // Multiple blank lines
    .trim()

  console.log(`✅ Cleaned text (${text.length} chars)`)

  return {
    success: true,
    text: text
  }
}
