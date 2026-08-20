export function configuredTargets(configuredSites, explicitTargets = []) {
  const targets = (explicitTargets.length > 0 ? explicitTargets : configuredSites).map((domain) =>
    String(domain).trim().toLowerCase()
  );
  return [...new Set(targets.filter(Boolean))];
}
