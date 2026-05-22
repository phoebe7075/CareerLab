export const COMMON_JSON_OUTPUT_RULES = `## JSON Output Rules
Return strict JSON only.
Do not include markdown fences.
Do not include commentary before or after the JSON.
Do not wrap the response in \`\`\`json.
Use exactly the field names in the Required JSON Shape.
Do not rename fields.
Do not add top-level fields unless explicitly allowed.
Use arrays for array fields, even if empty.
Use empty arrays instead of null.
Use empty strings instead of null for string fields.
Use numbers for score fields, not strings.
Do not include percent signs in numeric fields.
Do not include comments inside JSON.
Do not include trailing commas.
If information is missing, use an empty string or empty array and add a warning/question in the appropriate field.`;

export const COMMON_FACT_POLICY = `## Fact Policy
- Do not invent metrics.
- Do not invent ownership.
- Do not claim architecture ownership.
- Do not exaggerate framework, language, or platform experience.
- Do not add technologies not present in evidence.
- Do not mix unrelated projects, systems, periods, or evidence incorrectly.
- Treat metricsToVerify as unconfirmed.
- Treat dangerousClaims as phrases to avoid.
- Use safeClaims as the safest wording basis.
- If evidence is missing, ask a question instead of inventing.`;

export const COMMON_CAREER_TONE_POLICY = `## Career Tone Policy
- Write for the user's stated career stage. If the career stage is missing, keep the tone practical and not senior-like.
- Keep the tone practical, honest, and not senior-like.
- Prefer concrete work context over inflated achievement language.
- Separate verified facts from interpretation and future confirmation needs.`;
