declare module "leo-profanity" {
  interface LeoProfanity {
    loadDictionary(locale?: string): void;
    check(text: string): boolean;
    clean(text: string): string;
  }
  const profanity: LeoProfanity;
  export default profanity;
}
