export type CurriculumDomainId =
  | 'angular'
  | 'dotnet'
  | 'dsa'
  | 'azure'
  | 'system_design'
  | 'behavioral';

export interface DomainMeta {
  id: CurriculumDomainId;
  name: string;
  baselineTarget: number;
  color: string;
  badgeClass: string;
  gradientClass: string;
}

export const CURRICULUM_DOMAINS: Record<CurriculumDomainId, DomainMeta> = {
  angular: {
    id: 'angular',
    name: 'Angular',
    baselineTarget: 12,
    color: 'text-sky-400',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    gradientClass: 'bg-gradient-to-r from-sky-500 to-blue-500',
  },
  dotnet: {
    id: 'dotnet',
    name: '.NET Core',
    baselineTarget: 12,
    color: 'text-purple-400',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
    gradientClass: 'bg-gradient-to-r from-purple-500 to-indigo-500',
  },
  dsa: {
    id: 'dsa',
    name: 'DSA',
    baselineTarget: 14,
    color: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    gradientClass: 'bg-gradient-to-r from-emerald-500 to-teal-400',
  },
  azure: {
    id: 'azure',
    name: 'Azure AI',
    baselineTarget: 8,
    color: 'text-cyan-400',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    gradientClass: 'bg-gradient-to-r from-cyan-500 to-blue-600',
  },
  system_design: {
    id: 'system_design',
    name: 'System Design',
    baselineTarget: 8,
    color: 'text-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    gradientClass: 'bg-gradient-to-r from-amber-500 to-orange-400',
  },
  behavioral: {
    id: 'behavioral',
    name: 'Behavioral STAR',
    baselineTarget: 8,
    color: 'text-rose-400',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    gradientClass: 'bg-gradient-to-r from-rose-500 to-pink-500',
  },
};

/**
 * Deterministically classifies any focus task into one of the 6 core curriculum domains.
 * Prioritizes task code prefix, category, bucket, then title keywords.
 */
export const classifyTaskDomain = (task: {
  title?: string;
  category?: string;
  bucket?: string;
  code?: string;
}): CurriculumDomainId => {
  const code = (task.code || '').toUpperCase().trim();
  const cat = (task.category || '').toLowerCase().trim();
  const bucket = (task.bucket || '').toLowerCase().trim();
  const title = (task.title || '').toLowerCase().trim();

  // 1. Exact Code Prefix Match (Highest Priority)
  if (code.startsWith('NG-')) return 'angular';
  if (code.startsWith('CS-') || code.startsWith('WA-') || code.startsWith('EF-') || code.startsWith('NET-')) return 'dotnet';
  if (code.startsWith('DSA-') || code.startsWith('LC-')) return 'dsa';
  if (code.startsWith('AZ-') || code.startsWith('AI-')) return 'azure';
  if (code.startsWith('SD-') || code.startsWith('SYS-')) return 'system_design';
  if (code.startsWith('STAR-') || code.startsWith('BEH-')) return 'behavioral';

  // 2. Explicit Category / Bucket Match
  if (cat === 'angular') return 'angular';
  if (cat === '.net' || cat === 'dotnet' || cat === 'c#' || cat === 'csharp') return 'dotnet';
  if (cat === 'leetcode' || cat === 'dsa' || bucket === 'dsa') return 'dsa';
  if (cat === 'azure' || bucket === 'azure') return 'azure';
  if (cat === 'systemdesign' || cat === 'system design' || cat === 'sysdesign') return 'system_design';
  if (cat === 'behavioral' || cat === 'star') return 'behavioral';

  // 3. Keyword Heuristics on Title
  if (/angular|rxjs|signal|interceptor|formgroup|directive|template-driven|change detection|onpush/i.test(title)) {
    return 'angular';
  }
  if (/\.net|c#|asp\.net|ef core|entity framework|mediatr|dependency injection|linq|record vs class|struct vs class|garbage collection|gc|clr/i.test(title)) {
    return 'dotnet';
  }
  if (/dsa|leetcode|neetcode|algorithm|binary search|two pointer|sliding window|tree|graph|dynamic programming|dp|palindrome|linked list/i.test(title)) {
    return 'dsa';
  }
  if (/azure|openai|semantic kernel|ai-102|cognitive services|blob storage|cosmos|prompt engineering|rag\b/i.test(title)) {
    return 'azure';
  }
  if (/system design|microservices|api gateway|kafka|rabbitmq|load balancer|redis|sharding|cqrs|event sourcing|idempotency|rate limiter/i.test(title)) {
    return 'system_design';
  }
  if (/star\b|behavioral|situation|leadership|conflict|interview story|story vault|post-mortem/i.test(title)) {
    return 'behavioral';
  }

  // Fallback safe default
  return 'angular';
};
