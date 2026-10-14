// dist/index.html → artifact.html (문서 골격 태그 제거: 아티팩트 게시용)
import { readFileSync, writeFileSync } from 'node:fs'
let h = readFileSync('dist/index.html', 'utf8')
h = h.replace(/<!doctype html>/i, '').replace(/<\/?html[^>]*>/gi, '').replace(/<\/?head>/gi, '').replace(/<\/?body>/gi, '')
  .replace(/<meta charset[^>]*>/i, '').replace(/<meta name="viewport"[^>]*>/i, '')
writeFileSync('artifact.html', h.trim())
