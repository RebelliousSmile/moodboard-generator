export function detectPosition(url: string | undefined, tags?: string[]): string {
  const u = (url || '').toLowerCase();
  const t = (tags || []).join(' ').toLowerCase();

  if (
    u.match(/church|lighthouse|phare|eglise|tower|clocher|dozaki|imochiura/) ||
    t.match(/verticalite|clocher|sommet|fleche/)
  ) {
    return 'center top';
  }

  if (
    u.match(/port|quai|beach|plage|coast|sea|harbor|ferry/) ||
    t.match(/quai|eau|plage|port|sol/)
  ) {
    return 'center bottom';
  }

  if (
    u.match(/aerial|drone|dji|vue.*aer/) ||
    t.match(/vue-aerienne|archipel/)
  ) {
    return 'center center';
  }

  return 'center 35%';
}
