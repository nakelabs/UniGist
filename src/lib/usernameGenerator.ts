// Catchy, memorable anonymous username generator (e.g., candyspice, sexyseven, joyboy)
// Deterministic based on ID so the username stays consistent for each post/comment,
// but feels completely random, fresh, and non-repeating.

const PREFIXES = [
  'candy', 'sexy', 'joy', 'wild', 'honey', 'cherry', 'velvet', 'toxic',
  'sassy', 'spicy', 'golden', 'cosmic', 'frosty', 'shadow', 'pixel', 'silver',
  'ruby', 'breezy', 'glitch', 'retro', 'bubble', 'choco', 'sunny', 'neon',
  'rebel', 'disco', 'silent', 'hyper', 'vivid', 'lucky', 'savage', 'chill',
  'sweet', 'dark', 'electric', 'magic', 'turbo', 'phantom', 'cyber', 'mystic',
  'stormy', 'peachy', 'diamond', 'cinnamon', 'bad', 'super', 'stellar', 'clover',
  'sugar', 'midnight', 'velvet', 'atomic', 'smooth', 'crimson', 'astral', 'rogue',
  'funky', 'crazy', 'clever', 'danger', 'secret', 'brave', 'urban', 'silent',
  'flirty', 'playful', 'silly', 'sleepy', 'moody', 'ghostly', 'speedy', 'bubbly'
];

const SUFFIXES = [
  'spice', 'seven', 'boy', 'girl', 'fox', 'viper', 'queen', 'king',
  'rush', 'rider', 'punk', 'knight', 'muse', 'vibe', 'phantom', 'rebel',
  'legend', 'walker', 'bullet', 'dream', 'cat', 'badger', 'storm', 'spark',
  'heart', 'shadow', 'demon', 'angel', 'boss', 'witch', 'wizard', 'star',
  'ninja', 'panda', 'tiger', 'wolf', 'ghost', 'flare', 'pulse', 'breeze',
  'wave', 'frost', 'fire', 'echo', 'cloud', 'rover', 'pilot', 'chief',
  'ace', 'bandit', 'scout', 'drifter', 'champ', 'hero', 'spirit', 'hunter',
  'hawk', 'raven', 'comet', 'bloom', 'shade', 'striker', 'glider', 'sparkle'
];

// Simple, elegant solid colors for avatars — NO GRADIENTS
const SOLID_AVATAR_COLORS = [
  { bg: '#25282e', text: '#e7e9ea' }, // Sleek Slate
  { bg: '#1d3652', text: '#60a5fa' }, // Blue
  { bg: '#3e1a24', text: '#f43f5e' }, // Rose
  { bg: '#163326', text: '#34d399' }, // Emerald
  { bg: '#311c47', text: '#c084fc' }, // Purple
  { bg: '#3c2615', text: '#fbbf24' }, // Amber
  { bg: '#133538', text: '#2dd4bf' }, // Teal
  { bg: '#3b2230', text: '#f472b6' }, // Pink
  { bg: '#2b2c34', text: '#cbd5e1' }, // Steel
];

/**
 * Hash a string or number into an integer
 */
function hashId(id: string | number): number {
  const str = id.toString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export interface GeneratedUser {
  username: string; // e.g. "candyspice"
  handle: string;   // e.g. "@candyspice"
  initials: string; // e.g. "CS"
  avatarBg: string; // solid color
  avatarText: string;
  avatarUrl: string; // DiceBear avatar
}

/**
 * Format large numbers like Twitter (e.g. 108K, 10K, 719)
 */
export function formatTwitterNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Calculate a deterministic, realistic view count for a post like Twitter
 */
export function getPostViews(postId: number, likesCount: number = 0, commentsCount: number = 0): string {
  const hash = hashId(`views_${postId}`);
  // Twitter typical impressions are ~15-40x likes, plus baseline traffic
  const baseViews = 150 + (hash % 850);
  const likesMultiplier = (likesCount || 0) * (20 + (hash % 30));
  const commentsMultiplier = (commentsCount || 0) * (35 + (hash % 40));
  const total = baseViews + likesMultiplier + commentsMultiplier;
  return formatTwitterNumber(total);
}

/**
 * Returns a memorable username and solid avatar styling for a given ID
 */
export function getGeneratedUser(id: string | number, salt: string = ''): GeneratedUser {
  const rawHash = hashId(`${id}_${salt}`);
  
  const prefixIndex = rawHash % PREFIXES.length;
  // Use a secondary salt for suffix to avoid correlated pairs
  const suffixIndex = Math.floor(rawHash / PREFIXES.length) % SUFFIXES.length;
  
  const prefix = PREFIXES[prefixIndex];
  const suffix = SUFFIXES[suffixIndex];
  
  // Example: "candyspice", "sexyseven", "joyboy"
  const username = `${prefix}${suffix}`;
  const handle = `@${username}`;
  
  // Initials: 2 letters (e.g. C + S)
  const initials = `${prefix[0].toUpperCase()}${suffix[0].toUpperCase()}`;
  
  const colorIndex = rawHash % SOLID_AVATAR_COLORS.length;
  const { bg, text } = SOLID_AVATAR_COLORS[colorIndex];

  // Clean, modern DiceBear minimalist avatars for Twitter look
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=${bg.replace('#', '')}`;

  return {
    username,
    handle,
    initials,
    avatarBg: bg,
    avatarText: text,
    avatarUrl,
  };
}

