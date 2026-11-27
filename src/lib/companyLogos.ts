/**
 * Company logos bundled with the app (public/logos/<company id>.webp|svg), keyed by the placement company id.
 * Taken once from each company's own website (Wikimedia Commons for Cisco and Infosys) and checked by eye; a
 * company we couldn't confirm keeps its initials. Bundled, so showing a logo never calls another site.
 *
 * style: "full" = an opaque square icon, shown edge to edge like an app icon; "glass" = a transparent logo (any
 * white background removed; dark single-colour marks recoloured white) on the dark glass tile; "light" = a dark
 * or faint coloured logo that needs a light tile to stay readable.
 */
export type LogoStyle = "full" | "glass" | "light";

const LOGOS: Record<string, [string, LogoStyle]> = {
  "amazon": ["amazon.webp", "full"],
  "aspect-ratio": ["aspect-ratio.webp", "light"],
  "bank-of-america": ["bank-of-america.webp", "light"],
  "bdo": ["bdo.webp", "light"],
  "billions": ["billions.webp", "light"],
  "bny": ["bny.webp", "glass"],
  "busy-infotech": ["busy-infotech.webp", "glass"],
  "callease-ai": ["callease-ai.webp", "glass"],
  "capgemini-exceller": ["capgemini-exceller.webp", "light"],
  "carwale-cartrade-tech": ["carwale-cartrade-tech.webp", "glass"],
  "cisco": ["cisco.svg", "light"],
  "commotion": ["commotion.webp", "glass"],
  "dataorb": ["dataorb.webp", "full"],
  "e2m": ["e2m.webp", "glass"],
  "e6data": ["e6data.webp", "light"],
  "elip": ["elip.webp", "full"],
  "enterpret": ["enterpret.webp", "full"],
  "futures-first": ["futures-first.webp", "light"],
  "gift-street-capital": ["gift-street-capital.webp", "light"],
  "goldman-sachs": ["goldman-sachs.webp", "glass"],
  "google": ["google.webp", "glass"],
  "hyperface-technologies": ["hyperface-technologies.webp", "light"],
  "infosys": ["infosys.svg", "light"],
  "inrisk-labs": ["inrisk-labs.webp", "glass"],
  "intellytics-solutions": ["intellytics-solutions.webp", "glass"],
  "intergrella-it-consulting": ["intergrella-it-consulting.webp", "glass"],
  "juspay": ["juspay.webp", "glass"],
  "kenexai": ["kenexai.webp", "full"],
  "keyence": ["keyence.webp", "light"],
  "kickdrum": ["kickdrum.webp", "full"],
  "loginext": ["loginext.webp", "light"],
  "loyalty-juggernaut": ["loyalty-juggernaut.webp", "glass"],
  "maq-software": ["maq-software.webp", "light"],
  "motadata": ["motadata.webp", "light"],
  "nobroker-technologies": ["nobroker-technologies.webp", "glass"],
  "nvidia": ["nvidia.webp", "glass"],
  "obvious-ai": ["obvious-ai.webp", "glass"],
  "pravi": ["pravi.webp", "light"],
  "quantiphi-analytics": ["quantiphi-analytics.webp", "light"],
  "raapyd-alticon-technologies": ["raapyd-alticon-technologies.webp", "glass"],
  "reelo": ["reelo.webp", "glass"],
  "rishabh-software": ["rishabh-software.webp", "glass"],
  "rysun-labs": ["rysun-labs.webp", "glass"],
  "sasken-technologies": ["sasken-technologies.webp", "glass"],
  "searce": ["searce.webp", "glass"],
  "shipmnts": ["shipmnts.webp", "glass"],
  "shipturtle": ["shipturtle.webp", "glass"],
  "sirion": ["sirion.webp", "glass"],
  "sprinklr": ["sprinklr.webp", "glass"],
  "squadstack-ai": ["squadstack-ai.webp", "glass"],
  "stempedia": ["stempedia.webp", "glass"],
  "techify": ["techify.webp", "glass"],
  "tekion": ["tekion.webp", "full"],
  "titan": ["titan.webp", "glass"],
  "toddle": ["toddle.webp", "glass"],
  "trading-technologies": ["trading-technologies.webp", "glass"],
  "unifyapps": ["unifyapps.webp", "light"],
  "vehant-technologies": ["vehant-technologies.webp", "glass"],
  "wells-fargo": ["wells-fargo.webp", "full"],
  "zanskar-securities": ["zanskar-securities.webp", "glass"],
  "zeus-learning": ["zeus-learning.svg", "light"],
};

export function companyLogo(id: string | null | undefined): { src: string; style: LogoStyle } | null {
  const hit = id ? LOGOS[id] : undefined;
  return hit ? { src: `${import.meta.env.BASE_URL}logos/${hit[0]}`, style: hit[1] } : null;
}
