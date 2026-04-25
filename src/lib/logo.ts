const LOGO_BY_AID_ID: Record<string, string> = {
  'str-2026': 'lhdn.png',
  'sara-2026': 'mykasih.png',
  'sara-untuk-semua-2026': 'mof.png',
  'ekasih-registration': 'icu_jpm.png',
  'mysalam-2026': 'mof.png',
  'etunai-belia-2026': 'mof.png',
  'jkm-penjaga-oku': 'jkm.png',
  'jkm-bib': 'jkm.png',
  'jkm-bantuan-keluarga-miskin': 'jkm.png',
  'bantuan-pesara': 'jpa.png',
  'lzs-bsh-bulanan': 'lzs.png',
  'lzs-bantuan-pendidikan': 'lzs.png',
  'maiwp-bantuan-asnaf': 'maiwp.png',
  'tbs-bantuan-asnaf': 'tbs.png',
  'bantuan-bingkas-selangor': 'selangor_state.png',
};

export function getAidLogo(aidId: string): string | null {
  const file = LOGO_BY_AID_ID[aidId];
  return file ? `/logo/${file}` : null;
}
