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

// Función para des-aplanar notación de puntos a objeto anidado
function unflatten(flat) {
  const result = {};
  for (const key in flat) {
    const keys = key.split('.');
    let curr = result;
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        curr[k] = flat[key];
      } else {
        if (!curr[k]) curr[k] = {};
        curr = curr[k];
      }
    });
  }
  return result;
}

function main() {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

  const flatEn = flatten(en);
  const flatEs = flatten(es);

  // Buscar claves que faltan en es.json
  const missing = {};
  for (const key in flatEn) {
    if (!(key in flatEs)) {
      missing[key] = flatEn[key];
    }
  }

  if (Object.keys(missing).length === 0) {
    console.log('No hay claves faltantes. ¡Todo está sincronizado!');
    return;
  }

  // Leer y parsear es.json
  const esRaw = fs.readFileSync(esPath, 'utf8');
  const esJson = JSON.parse(esRaw);

  // Insertar las claves faltantes en formato plano dentro de 'translations'
  let added = 0;
  for (const key in missing) {
    esJson.translations[key] = missing[key];
    added++;
  }

  if (added > 0) {
    fs.writeFileSync(esPath, JSON.stringify(esJson, null, 2), 'utf8');
    console.log(`Se agregaron ${added} claves faltantes a es.json en formato plano (dot notation).`);
  } else {
    console.log('No hay claves faltantes para agregar.');
  }
}

main();
