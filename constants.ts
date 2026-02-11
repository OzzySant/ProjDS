export const API_URLS = {
  BIBLE: {
    NVI: 'https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/nvi.json',
    ACF: 'https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/acf.json',
    AA: 'https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/aa.json',
  },
  // Using the canonical source for Harpa Cristã JSON
  HARPA: 'https://raw.githubusercontent.com/DanielLiberato/Harpa-Crista-JSON-640-Hinos-Completa/master/json/harpa.json'
};

export const BIBLE_VERSIONS = [
  { id: 'nvi', label: 'Nova Versão Internacional (NVI)' },
  { id: 'acf', label: 'Almeida Corrigida Fiel (ACF)' },
  { id: 'aa', label: 'Almeida e Atualizada (AA)' },
];