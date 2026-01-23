// Search for German original texts
const booksNeeded = [
  { title: 'Die Verwandlung', author: 'Kafka', searchTerm: 'verwandlung kafka' },
  { title: 'Buddenbrooks', author: 'Mann', searchTerm: 'buddenbrooks mann' },
  { title: 'Die Leiden des jungen Werther', author: 'Goethe', searchTerm: 'werther goethe' },
  { title: 'Der Prozess', author: 'Kafka', searchTerm: 'prozess kafka' }
]

console.log('Known German ebook URLs to try:\n')

// From research - these might be the German originals
console.log('Manual search needed for:')
console.log('1. Die Verwandlung - try searching "Kafka German" on Gutenberg')
console.log('2. Buddenbrooks - try searching "Mann Buddenbrooks German"')
console.log('3. Werther - try searching "Goethe Werther German"')
console.log('4. Der Prozess - try searching "Kafka Prozess German"')

console.log('\nKnown working German texts:')
console.log('- Der Tod in Venedig #12108 ✅ (already have this)')
console.log('- Der Schimmelreiter #74008 ✅ (just imported)')

console.log('\nI will try systematic URL checking...')
