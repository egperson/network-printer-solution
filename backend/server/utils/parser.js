const cheerio = require('cheerio');

// Translation map for supply names
const supplyTranslations = {
  // Cartridges
  'Black Cartridge': 'Cartucho Preto',
  'Cyan Cartridge': 'Cartucho Ciano',
  'Magenta Cartridge': 'Cartucho Magenta',
  'Yellow Cartridge': 'Cartucho Amarelo',
  'Tri-color Cartridge': 'Cartucho Colorido',
  'Photo Cartridge': 'Cartucho de Foto',

  // Toner
  'Black Toner': 'Toner Preto',
  'Cyan Toner': 'Toner Ciano',
  'Magenta Toner': 'Toner Magenta',
  'Yellow Toner': 'Toner Amarelo',

  // Drums
  'Drum Unit': 'Unidade de Cilindro',
  'Drum Kit': 'Kit de Cilindro',
  'Black Drum': 'Cilindro Preto',
  'Cyan Drum': 'Cilindro Ciano',
  'Magenta Drum': 'Cilindro Magenta',
  'Yellow Drum': 'Cilindro Amarelo',
  'Imaging Drum': 'Cilindro de Imagem',
  'Drum': 'Cilindro',

  // Maintenance Kit
  'Maintenance Kit': 'Kit de Manutenção',
  'Fuser Kit': 'Kit Fusor',
  'Transfer Kit': 'Kit de Transferência',
  'Document Feeder Kit': 'Kit do Alimentador de Documentos',
  'Roller Kit': 'Kit de Rolos',
  'Pickup Roller': 'Rolo de Alimentação',
  'Separation Roller': 'Rolo de Separação',

  // Others
  'Waste Toner': 'Toner Residual',
  'Waste Toner Container': 'Contentor de Toner Residual',
  'Collection Unit': 'Unidade Coletora',
  'Transfer Belt': 'Correia de Transferência',
  'Transfer Unit': 'Unidade de Transferência',
  'Fuser': 'Fusor',
  'ADF': 'Alimentador Automático',
  'Staples': 'Grampos',
  'Staple Cartridge': 'Cartucho de Grampos',

  // HP Non-Genuine
  'Non-HP': 'Não Original HP',
  'Non-Genuine': 'Não Original',
  'Third-party': 'Terceiros',

  // Status and conditions
  'Low': 'Baixo',
  'Very Low': 'Muito Baixo',
  'Empty': 'Vazio',
  'OK': 'OK',
  'Replace': 'Substituir',
  'Order': 'Encomendar',
  'Genuine': 'Original',

  // Generic terms
  'Black': 'Preto',
  'Cyan': 'Ciano',
  'Magenta': 'Magenta',
  'Yellow': 'Amarelo',
  'Toner': 'Toner',
  'Cartridge': 'Cartucho',
  'Ink': 'Tinta',
  'Supply': 'Consumível',
  'Supplies': 'Consumíveis',
  'Kit': 'Kit',
  'Unit': 'Unidade'
};

/**
 * Translate supply name to Portuguese
 * @param {string} name - Supply name in English
 * @returns {string} Translated name
 */
function translateSupplyName(name) {
  if (!name) return name;

  // Try exact match first
  if (supplyTranslations[name]) {
    return supplyTranslations[name];
  }

  // Try partial matches (for variations)
  let translated = name;
  for (const [en, pt] of Object.entries(supplyTranslations)) {
    // Replace whole words only
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, pt);
  }

  return translated;
}

/**
 * Parse HTML from printer panel and return device object
 * @param {string} url 
 * @param {string} html 
 * @returns {object} device
 */
function parseDeviceFromHtml(url, html) {
  const $ = cheerio.load(html);
  const device = { name: url, url, timestamp: new Date().toISOString() };
  device.title = $('title').first().text() || null;
  const homeName = $('#HomeDeviceName').text().trim();
  if (homeName) device.deviceName = homeName;
  const homeIp = $('#HomeDeviceIp').text().trim();
  if (homeIp) device.deviceIp = homeIp;
  const mainStatus = $('#MachineStatus').text().trim() || $('.status-message').first().text().trim();
  if (mainStatus) device.machineStatus = mainStatus;
  const supplies = [];
  $('.consumable').each((i, el) => {
    const name = $(el).find('h2').first().text().trim();
    const plr = $(el).find('.plr').first().text().trim();
    const gauge = $(el).find('.gauge span').first().text().trim();
    if (name) supplies.push({ name: translateSupplyName(name), level: plr || gauge || null });
  });
  if (supplies.length === 0) {
    for (let i = 0; i < 12; i++) {
      const n = $(`#SupplyName${i}`).text().trim();
      const p = $(`#SupplyPLR${i}`).text().trim();
      if (n) supplies.push({ name: translateSupplyName(n), level: p || null });
    }
  }
  // Heurísticas adicionais: buscar por labels/strings comuns quando não houver blocos consumable
  if (supplies.length === 0) {
    const bodyText = $('body').text();
    // procurar por padrões como "Preto: 40%" ou "Black - 40%" ou "Cyan 10%"
    const regex = /(?:(Preto|Black|Ciano|Cyan|Magenta|Amarelo|Yellow|Toner|Tinta)[\s:\-–]*)(?:<|&lt;)?\s*(\d{1,3}%)/gi;
    let m;
    const found = {};
    while ((m = regex.exec(bodyText)) !== null) {
      const rawName = m[1];
      const level = m[2];
      const name = translateSupplyName(rawName.replace(/Toner|Tinta/i, 'Toner').trim());
      // evitar duplicatas
      if (!found[name + level]) {
        supplies.push({ name, level });
        found[name + level] = true;
      }
    }
    // procurar por porcentagens próximas a palavras-chave de consumíveis
    if (supplies.length === 0) {
      const pctRegex = /(\d{1,3})%/g;
      let pct;
      while ((pct = pctRegex.exec(bodyText)) !== null) {
        // pegar contexto ao redor
        const start = Math.max(0, pct.index - 40);
        const snippet = bodyText.substring(start, pct.index + 4);
        const nameMatch = snippet.match(/(Preto|Black|Ciano|Cyan|Magenta|Amarelo|Yellow|Toner|Tinta)/i);
        if (nameMatch) {
          const name = translateSupplyName(nameMatch[0]);
          const level = pct[0];
          supplies.push({ name, level });
        }
      }
    }
  }
  if (supplies.length) device.supplies = supplies;
  // Detectar tipo do dispositivo (color ou mono)
  if (device.supplies && device.supplies.length) {
    const names = device.supplies.map(s => String(s.name).toLowerCase()).join(' ');
    if (/magenta|amarelo|ciano|cyan|magenta|yellow/.test(names)) device.type = 'color';
    else device.type = 'mono';
  }
  const trays = [];
  $('#MediaTable tbody tr').each((i, tr) => {
    const name = $(tr).find('[id^="TrayBinName_"]').text().trim() || $(tr).find('td').first().text().trim();
    const status = $(tr).find('[id^="TrayBinStatus_"]').text().trim() || $(tr).find('td').eq(1).text().trim();
    const capacity = $(tr).find('[id^="TrayBinCapacity_"]').text().trim() || $(tr).find('td').eq(2).text().trim();
    const size = $(tr).find('[id^="TrayBinSize_"]').text().trim() || $(tr).find('td').eq(3).text().trim();
    const type = $(tr).find('[id^="TrayBinType_"]').text().trim() || $(tr).find('td').eq(4).text().trim();
    if (name) trays.push({ name, status, capacity, size, type });
  });
  if (trays.length) device.trays = trays;
  const usageText = $('#UsagePage').text() || $('body').text();
  const pagesMatch = usageText.match(/(Total pages|Total de páginas|Total pages)[^0-9]*(\d{1,10})/i);
  if (pagesMatch) device.pages = pagesMatch[2];
  return device;
}

module.exports = { parseDeviceFromHtml };
