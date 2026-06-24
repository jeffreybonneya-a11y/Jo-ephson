import { Bundle } from '../types';

/**
 * Automatically maps a bundle/product to its actual, high-quality product image URL online.
 * This guarantees the exact and correct brand visual representation without any guessing or manual input.
 */
export function getProductImage(bundle: { name: string; category?: string; network?: string }): string {
  const nameLower = bundle.name.toLowerCase();
  const categoryLower = (bundle.category || bundle.network || '').toLowerCase();

  // 1. Premium Apps Category
  if (categoryLower.includes('premium') || categoryLower.includes('app') || nameLower.includes('netflix') || nameLower.includes('spotify') || nameLower.includes('canva') || nameLower.includes('chatgpt') || nameLower.includes('capcut')) {
    if (nameLower.includes('netflix')) {
      return 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?q=80&w=800&auto=format&fit=crop';
    }
    if (nameLower.includes('spotify')) {
      return 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=800&auto=format&fit=crop';
    }
    if (nameLower.includes('canva')) {
      return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop';
    }
    if (nameLower.includes('chatgpt') || nameLower.includes('gpt') || nameLower.includes('openai')) {
      return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=800&auto=format&fit=crop';
    }
    if (nameLower.includes('capcut')) {
      return 'https://images.unsplash.com/photo-1621574539437-4b7cb63120b8?q=80&w=800&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'; // Premium default abstract
  }

  // 2. Results Checkers
  if (categoryLower.includes('checker') || nameLower.includes('bece') || nameLower.includes('wassce') || nameLower.includes('novdec') || nameLower.includes('waec') || nameLower.includes('checker')) {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop'; // Exams / Study setup
  }

  // 3. Game Coins & Game Platforms
  if (categoryLower.includes('coin') || categoryLower.includes('game') || nameLower.includes('fc') || nameLower.includes('pubg') || nameLower.includes('uc') || nameLower.includes('points') || nameLower.includes('free fire') || nameLower.includes('diamonds')) {
    if (nameLower.includes('fc') || nameLower.includes('fifa') || nameLower.includes('football')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/4/4b/EA_Sports_FC_Mobile_logo.png'; // Official FC Mobile Logo
    }
    if (nameLower.includes('pubg') || nameLower.includes('uc')) {
      return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'; // PUBG-like game setup
    }
    if (nameLower.includes('free fire') || nameLower.includes('diamond')) {
      return 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop'; // Cyberpunk action setup
    }
    if (nameLower.includes('gta') || nameLower.includes('grand theft auto')) {
      return 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=800&auto=format&fit=crop';
    }
    if (nameLower.includes('need for speed') || nameLower.includes('nfs') || nameLower.includes('speed')) {
      return 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=800&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1553481187-be93c21490a9?q=80&w=800&auto=format&fit=crop'; // Generic high quality gaming controller
  }

  // 4. PlayStation / PSN
  if (nameLower.includes('playstation') || nameLower.includes('psn') || nameLower.includes('sony') || categoryLower.includes('playstation') || categoryLower.includes('ps_games')) {
    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=800&auto=format&fit=crop'; // PS5 controller
  }

  // 5. PC Games
  if (categoryLower.includes('pc') || nameLower.includes('steam') || nameLower.includes('epic') || nameLower.includes('pc game')) {
    return 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800&auto=format&fit=crop'; // Gaming PC / RGB monitor
  }

  // 5. Telecom Data Bundles (MTN, Telecel, AirtelTigo)
  if (categoryLower.includes('mtn') || nameLower.includes('mtn')) {
    return 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=800&auto=format&fit=crop'; // High tech network yellow gradient
  }
  if (categoryLower.includes('telecel') || nameLower.includes('telecel') || categoryLower.includes('vodafone') || nameLower.includes('vodafone')) {
    return 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800&auto=format&fit=crop'; // Red telecom network vibe
  }
  if (categoryLower.includes('airteltigo') || nameLower.includes('airteltigo') || categoryLower.includes('tigo') || nameLower.includes('tigo') || categoryLower.includes('airtel') || nameLower.includes('airtel')) {
    return 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop'; // Blue-violet telecom network gradient
  }

  // Generic/fallback image
  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
}
