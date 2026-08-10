const fs = require('fs')
const path = require('path')

const distIcons = path.join(__dirname, '..', 'node_modules', 'lucide-vue-next', 'dist', 'esm', 'icons')
const iconDefs = {}
for (const file of fs.readdirSync(distIcons)) {
  if (!file.endsWith('.js')) continue
  const text = fs.readFileSync(path.join(distIcons, file), 'utf8')
  const match = text.match(/createLucideIcon\("([^"]+)",\s*\[([\s\S]*?)\]\);/)
  if (!match) continue
  const iconName = match[1]
  const body = match[2]
  const parts = []
  const re = /\["(path|circle|rect|polyline|polygon)",\s*\{([^\}]+)\}\]/g
  let m
  while ((m = re.exec(body))) {
    const attrs = m[2]
    const dMatch = attrs.match(/d:\s*"([^"]+)"/)
    const rMatch = attrs.match(/r:\s*"([^"]+)"/)
    const pointsMatch = attrs.match(/points:\s*"([^"]+)"/)
    if (dMatch) parts.push(`path:${dMatch[1].trim()}`)
    else if (rMatch) parts.push(`circle:r=${rMatch[1].trim()}`)
    else if (pointsMatch) parts.push(`points:${pointsMatch[1].trim()}`)
    else parts.push(`tag:${m[1]}`)
  }
  if (parts.length) iconDefs[iconName] = parts
}
const iconMap = {}
for (const [name, parts] of Object.entries(iconDefs)) {
  const key = parts.join('|')
  iconMap[key] = iconMap[key] || []
  iconMap[key].push(name)
}

const vueFiles = []
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name)
    if (item.isDirectory()) walk(p)
    else if (p.endsWith('.vue')) vueFiles.push(p)
  }
}
walk(path.join(__dirname, '..', 'app'))

const matches = []
for (const file of vueFiles) {
  const text = fs.readFileSync(file, 'utf8')
  const svgRe = /<svg[\s\S]*?<\/svg>/g
  let m
  while ((m = svgRe.exec(text))) {
    const svg = m[0]
    const paths = []
    const pathRe = /<path[^>]*d="([^"]+)"[^>]*>/g
    let pm
    while ((pm = pathRe.exec(svg))) {
      paths.push(`path:${pm[1].trim()}`)
    }
    if (!paths.length) continue
    const key = paths.join('|')
    const iconNames = iconMap[key] || []
    matches.push({ file: path.relative(path.join(__dirname, '..'), file), svg, paths, iconNames })
  }
}
console.log(JSON.stringify(matches, null, 2))
