/** Require exactly one output for each input, without accepting invented keys. */
export function validateResultKeys(expected: string[], actual: string[]): void {
  const keys = new Set(actual);
  if (
    expected.length !== actual.length ||
    keys.size !== actual.length ||
    expected.some((key) => !keys.has(key))
  ) {
    throw new Error("AI returned missing, duplicate, or unexpected result keys. Please retry.");
  }
}
