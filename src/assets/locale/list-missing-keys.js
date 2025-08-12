const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'en.json');
const esPath = path.join(__dirname, 'es.json');

// Función para aplanar objetos anidados en notación de puntos
function flatten(obj, prefix = '', res = {}) {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      flatten(val, newKey, res);
    } else {
      res[newKey] = val;
    }
  }
  return res;
}

function main() {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

  const flatEn = flatten(en.translations);
  const flatEs = flatten(es.translations);

  // Buscar claves que faltan en es.json
  const missing = [];
  for (const key in flatEn) {
    if (!(key in flatEs)) {
      missing.push(key);
    }
  }

  if (missing.length === 0) {
    console.log('No hay claves faltantes. ¡Todo está sincronizado!');
  } else {
    console.log('Claves faltantes en es.json:');
    missing.forEach(k => console.log(k));
  }
}

main();
