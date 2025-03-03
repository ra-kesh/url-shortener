/**
 * Generates a random URL with a random subdomain and TLD
 * @returns {string} A randomly generated URL
 */
export function generateRandomUrl() {
  const domains = ["com", "org", "net", "io", "gov"];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  const randomSubdomain = Math.random().toString(36).substring(2, 8);
  return `https://${randomSubdomain}.${randomDomain}`;
}

