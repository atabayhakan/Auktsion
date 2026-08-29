import fs from 'fs'
import path from 'path'

function findPlaceholdersInLocales(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const regex = /['"`]([^'"`]*\{[a-zA-Z0-9_]+\}[^'"`]*)['"`]/g
  const matches = []
  let match
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1])
  }
  return matches
}

console.log('--- KY placeholders ---')
console.log(findPlaceholdersInLocales('frontend/src/locales/ky.ts'))

console.log('--- RU placeholders ---')
console.log(findPlaceholdersInLocales('frontend/src/locales/ru.ts'))

console.log('--- TR placeholders ---')
console.log(findPlaceholdersInLocales('frontend/src/locales/tr.ts'))
