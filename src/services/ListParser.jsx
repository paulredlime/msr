/**
 * Advanced Shopping List Parser
 * Handles quantity/price parsing and strict brand/own-brand matching
 */

const STORE_TOKENS = [
  'asda', 'tesco', 'sainsbury', 'sainsbury\'s', 'morrisons', 'waitrose', 
  'aldi', 'lidl', 'iceland', 'co-op', 'coop', 'ocado', 'the bakery at asda'
];

export class ListParser {
  static parseUserList(input) {
    if (!input || typeof input !== 'string') return [];
    
    return input.split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(raw => this.parseItem(raw))
      .filter(Boolean);
  }

  static parseItem(raw) {
    try {
      // Extract £price at end
      const priceMatch = raw.match(/£\s*(\d+(?:\.\d{1,2})?)\s*$/i);
      if (!priceMatch) {
        console.warn(`No trailing price found: ${raw}`);
        return null;
      }
      
      const lineTotal = parseFloat(priceMatch[1]);
      const beforePrice = raw.slice(0, priceMatch.index).trim();

      // Penultimate token = quantity
      const parts = beforePrice.split(/\s+/);
      const qtyToken = parts.pop();
      const qty = /^\d+$/.test(qtyToken) ? parseInt(qtyToken, 10) : 1;

      const name = parts.join(' ').replace(/\s{2,}/g, ' ').trim();

      // Pack extraction
      const pack = this.extractPack(name);

      // Brand / own-brand detection
      const { brand, ownBrand } = this.detectBrand(name);

      return {
        raw,
        name,
        qty,
        lineTotal,
        unitPrice: +(lineTotal / Math.max(1, qty)).toFixed(2),
        pack,
        brand,
        ownBrand
      };
    } catch (error) {
      console.error(`Failed to parse item: ${raw}`, error);
      return null;
    }
  }

  static extractPack(name) {
    // "4 x 42g" pattern
    const multiPackMatch = name.match(/(\d+)\s*[x×]\s*(\d+)\s*(g|ml|cl)/i);
    if (multiPackMatch) {
      return {
        qty: parseInt(multiPackMatch[1]),
        size: parseInt(multiPackMatch[2]),
        unit: multiPackMatch[3].toLowerCase()
      };
    }

    // Single size patterns: "70cl", "250g", "4 Pints"
    const sizeMatch = name.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cl|pints?)/i);
    if (sizeMatch) {
      return {
        size: parseFloat(sizeMatch[1]),
        unit: sizeMatch[2].toLowerCase()
      };
    }

    return undefined;
  }

  static detectBrand(name) {
    const lower = name.toLowerCase();
    
    // Check for own-brand indicators
    const ownBrand = STORE_TOKENS.find(token => 
      lower.startsWith(token + ' ') || 
      lower.includes(' at ' + token + ' ') ||
      lower.includes(' ' + token + ' ')
    );

    if (ownBrand) {
      return {
        brand: undefined,
        ownBrand: ownBrand.replace(/[^a-z]/g, '')
      };
    }

    // Extract first word as potential brand for non-own-brand items
    const firstWord = name.split(' ')[0];
    const brand = firstWord && firstWord.length > 2 ? firstWord : undefined;

    return { brand, ownBrand: undefined };
  }
}

export class ProductMatcher {
  static normalizeSize(pack) {
    if (!pack) return undefined;
    
    const unit = pack.unit;
    if (!unit) return undefined;
    
    const qty = pack.qty ?? 1;
    const size = (pack.size ?? 1) * qty;

    switch (unit) {
      case 'g': return { g: size };
      case 'kg': return { g: size * 1000 };
      case 'ml': return { ml: size };
      case 'l': return { ml: size * 1000 };
      case 'cl': return { ml: size * 10 };
      case 'pint':
      case 'pints': return { ml: size * 568 };
      default: return undefined;
    }
  }

  static withinTolerance(a, b, pct = 0.10) {
    return Math.abs(a - b) <= Math.max(a, b) * pct;
  }

  static tokens(str) {
    return str.toLowerCase()
      .replace(/[^a-z0-9% ]+/g, ' ')
      .split(/\s+/)
      .filter(t => t && !['the', 'at', 'and', 'with', 'for', 'of', 'in'].includes(t));
  }

  static isOwnBrandName(name) {
    const lower = name.toLowerCase();
    return STORE_TOKENS.some(token => 
      lower.startsWith(token + ' ') || 
      lower.includes(' ' + token + ' ')
    );
  }

  static parseSizeFromTitle(title, unit) {
    const patterns = {
      g: /(\d+(?:\.\d+)?)\s*g\b/i,
      kg: /(\d+(?:\.\d+)?)\s*kg\b/i,
      ml: /(\d+(?:\.\d+)?)\s*ml\b/i,
      l: /(\d+(?:\.\d+)?)\s*l\b/i,
      cl: /(\d+(?:\.\d+)?)\s*cl\b/i
    };

    const match = title.match(patterns[unit]);
    if (!match) return null;

    const value = parseFloat(match[1]);
    
    // Convert to base units (g or ml)
    switch (unit) {
      case 'kg': return value * 1000;
      case 'l': return value * 1000;
      case 'cl': return value * 10;
      default: return value;
    }
  }

  static isAcceptableMatch(item, candidateTitle, targetStore, allowSubstitutions = false) {
    const itemTokens = this.tokens(item.name);
    const candidateTokens = this.tokens(candidateTitle);

    let score = 0;

    // Brand matching rules
    if (item.brand && !this.isOwnBrandName(candidateTitle)) {
      // Branded item - require exact brand match
      const candidateBrand = candidateTokens[0];
      if (!candidateBrand || candidateBrand !== item.brand.toLowerCase()) {
        if (!allowSubstitutions) return { ok: false, score: 0 };
        score -= 30; // Penalty for brand mismatch with substitutions allowed
      } else {
        score += 40; // Brand match bonus
      }
    }

    if (item.ownBrand) {
      // Own-brand item - require target store own-brand
      const isTargetOwnBrand = this.isOwnBrandName(candidateTitle) || 
                              candidateTokens[0] === targetStore.toLowerCase();
      if (!isTargetOwnBrand) {
        if (!allowSubstitutions) return { ok: false, score: 0 };
        score -= 20; // Penalty for own-brand mismatch
      } else {
        score += 40; // Own-brand match bonus
      }
    }

    // Product type token overlap (ignore size/quantity tokens)
    const relevantTokens = token => !/^(\d+|g|kg|ml|l|cl|pints?)$/.test(token);
    const itemRelevantTokens = itemTokens.filter(relevantTokens);
    const overlap = itemRelevantTokens.filter(token => candidateTokens.includes(token)).length;
    
    if (itemRelevantTokens.length > 0) {
      score += Math.min(30, (overlap / itemRelevantTokens.length) * 30);
    }

    // Size matching
    const itemSize = this.normalizeSize(item.pack);
    if (itemSize) {
      let candidateSize = null;
      
      if (itemSize.g) {
        candidateSize = this.parseSizeFromTitle(candidateTitle, 'g') || 
                       (this.parseSizeFromTitle(candidateTitle, 'kg') * 1000);
      } else if (itemSize.ml) {
        candidateSize = this.parseSizeFromTitle(candidateTitle, 'ml') || 
                       (this.parseSizeFromTitle(candidateTitle, 'l') * 1000) ||
                       (this.parseSizeFromTitle(candidateTitle, 'cl') * 10);
      }

      if (candidateSize) {
        const targetSize = itemSize.g || itemSize.ml;
        if (this.withinTolerance(targetSize, candidateSize, 0.10)) {
          score += 30; // Size match bonus
        } else {
          score -= 15; // Size mismatch penalty
        }
      }
    }

    // Alcohol ABV matching (if both have ABV)
    const itemABV = (item.name.match(/(\d{1,2}(?:\.\d)?)\s?%/) || [])[1];
    const candidateABV = (candidateTitle.match(/(\d{1,2}(?:\.\d)?)\s?%/) || [])[1];
    
    if (itemABV && candidateABV) {
      const abvDiff = Math.abs(parseFloat(itemABV) - parseFloat(candidateABV));
      if (abvDiff > 1) {
        if (!allowSubstitutions) return { ok: false, score: 0 };
        score -= 25; // ABV mismatch penalty
      } else {
        score += 10; // ABV match bonus
      }
    }

    const threshold = allowSubstitutions ? 40 : 70;
    return { ok: score >= threshold, score };
  }
}

export default { ListParser, ProductMatcher };