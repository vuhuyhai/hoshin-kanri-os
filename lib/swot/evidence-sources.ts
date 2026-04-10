export const SOURCE_REGISTRY = {
  macro:        { domains: ['gso.gov.vn', 'mpi.gov.vn', 'mof.gov.vn'],                   weight: 10 },
  research:     { domains: ['decisionlab.asia', 'virac.vn', 'nielseniq.com'],             weight: 9  },
  global:       { domains: ['worldbank.org', 'imf.org', 'adb.org', 'statista.com'],       weight: 8  },
  finance_news: { domains: ['cafef.vn', 'baodautu.vn', 'vneconomy.vn', 'thoibaotaichinhvietnam.vn'], weight: 7 },
  general_news: { domains: ['vnexpress.net', 'nhandan.vn', 'tuoitre.vn'],                 weight: 5  },
} as const

export const ALL_CREDIBLE_DOMAINS = Object.values(SOURCE_REGISTRY).flatMap(s => s.domains)

export const DOMAIN_WEIGHT_MAP = Object.values(SOURCE_REGISTRY).reduce(
  (acc, source) => { source.domains.forEach(d => { acc[d] = source.weight }); return acc },
  {} as Record<string, number>
)
