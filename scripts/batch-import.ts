#!/usr/bin/env tsx

import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { downloadBook, type BookConfig } from './lib/downloader'
import { parseBook } from './lib/parser'
import { importBook } from './lib/importer'

// Load environment variables from .env.local
loadEnv({ path: path.join(__dirname, '..', '.env.local') })

interface BooksConfig {
  books: BookConfig[]
}

async function main() {
  console.log('🚀 Literary Forge - Batch Book Import\n')

  // 1. Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL')
    console.error('   SUPABASE_SECRET_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 2. Load books config
  const configFileName = process.argv[2] || 'books-config.json'
  const configPath = path.join(__dirname, configFileName)
  console.log(`📄 Loading config from: ${configFileName}`)
  const configFile = await fs.readFile(configPath, 'utf8')
  const config: BooksConfig = JSON.parse(configFile)

  console.log(`📚 Found ${config.books.length} books in config\n`)

  // 3. Process each book
  let successCount = 0
  let failureCount = 0

  for (const book of config.books) {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`📖 Processing: ${book.title} (${book.author.name})`)
    console.log('='.repeat(70))

    try {
      // Step 1: Download
      const downloadResult = await downloadBook(book)
      if (!downloadResult.success) {
        throw new Error(`Download failed: ${downloadResult.error}`)
      }

      // Step 2: Parse & Clean
      const parseResult = await parseBook(
        downloadResult.localPath!,
        book.source.type
      )
      if (!parseResult.success) {
        throw new Error(`Parse failed: ${parseResult.error}`)
      }

      // Step 3: Import to Database
      const importResult = await importBook(supabase, book, parseResult.text!)
      if (!importResult.success) {
        throw new Error(`Import failed: ${importResult.error}`)
      }

      console.log(`\n✅ SUCCESS: ${book.title}`)
      console.log(`   Created: ${importResult.chunksCreated} chunks`)
      if (importResult.chunksDeleted! > 0) {
        console.log(`   Replaced: ${importResult.chunksDeleted} old chunks`)
      }

      successCount++

    } catch (error) {
      console.error(`\n❌ FAILED: ${book.title}`)
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`)
      failureCount++
    }
  }

  // 4. Summary
  console.log(`\n\n${'='.repeat(70)}`)
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(70))
  console.log(`✅ Success: ${successCount}/${config.books.length}`)
  console.log(`❌ Failed:  ${failureCount}/${config.books.length}`)
  console.log()

  if (failureCount > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
