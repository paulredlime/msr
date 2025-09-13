import { Product } from "@/api/entities";
import { ProductAlias } from "@/api/entities";

class ProductMatcher {
  // Jaro-Winkler distance implementation
  static jaroWinkler(s1, s2) {
    if (s1 === s2) return 1.0;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0) return len2 === 0 ? 1.0 : 0.0;
    if (len2 === 0) return 0.0;
    
    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Identify matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = s2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0.0;
    
    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0;
    
    // Winkler modification
    const prefix = Math.min(4, Math.min(len1, len2));
    let prefixLength = 0;
    for (let i = 0; i < prefix; i++) {
      if (s1[i] === s2[i]) prefixLength++;
      else break;
    }
    
    return jaro + (0.1 * prefixLength * (1 - jaro));
  }

  // Normalize text for matching
  static normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Extract quantity information
  static parseQuantity(text) {
    const quantityPatterns = [
      /(\d+)\s*x\s*/i,  // "2x", "4 x"
      /(\d+)\s*pack/i,  // "6 pack", "12pack"
      /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|litre|liter)\b/i,  // "500g", "1.5L"
    ];

    for (const pattern of quantityPatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          quantity: parseFloat(match[1]),
          unit: match[2] || 'pack',
          text: match[0]
        };
      }
    }

    return { quantity: 1, unit: 'each', text: '' };
  }

  // Extract brand from text
  static extractBrand(text) {
    const commonBrands = [
      'tesco', 'asda', 'sainsbury', 'morrisons', 'waitrose',
      'heinz', 'lurpak', 'hovis', 'coca cola', 'pepsi',
      'kellogg', 'nestle', 'unilever', 'johnson', 'procter'
    ];

    const normalized = this.normalizeText(text);
    
    for (const brand of commonBrands) {
      if (normalized.includes(brand)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }

    return null;
  }

  // Main matching function
  static async findBestMatch(rawText) {
    try {
      const normalized = this.normalizeText(rawText);
      const quantity = this.parseQuantity(rawText);
      const brand = this.extractBrand(rawText);

      // Get all products for matching
      const products = await Product.list();
      
      if (products.length === 0) {
        return {
          matches: [],
          confidence: 0,
          matchType: 'none'
        };
      }

      // Score each product
      const scores = products.map(product => {
        let score = 0;
        let matchType = 'fuzzy';

        // GTIN exact match gets highest score
        if (product.gtin && rawText.includes(product.gtin)) {
          score = 1.0;
          matchType = 'exact_gtin';
        } else {
          // Title similarity (50% weight)
          const titleSimilarity = this.jaroWinkler(
            normalized,
            this.normalizeText(product.normalized_title || product.title)
          );
          score += titleSimilarity * 0.5;

          // Brand match bonus (20% weight)
          if (brand && product.brand && 
              this.normalizeText(brand) === this.normalizeText(product.brand)) {
            score += 0.2;
          }

          // Quantity/size similarity (30% weight)
          if (quantity.text && product.quantity) {
            const productQuantity = this.parseQuantity(product.quantity);
            if (quantity.unit === productQuantity.unit && 
                Math.abs(quantity.quantity - productQuantity.quantity) / productQuantity.quantity < 0.1) {
              score += 0.3;
            }
          }
        }

        return {
          product,
          score,
          matchType
        };
      });

      // Sort by score and return top matches
      scores.sort((a, b) => b.score - a.score);
      
      const topMatches = scores.slice(0, 3).filter(s => s.score > 0.3);
      
      return {
        matches: topMatches,
        confidence: topMatches.length > 0 ? topMatches[0].score : 0,
        matchType: topMatches.length > 0 ? topMatches[0].matchType : 'none',
        parsedQuantity: quantity,
        extractedBrand: brand
      };

    } catch (error) {
      console.error('Error in product matching:', error);
      return {
        matches: [],
        confidence: 0,
        matchType: 'error'
      };
    }
  }
}

export default ProductMatcher;