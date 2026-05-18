/** Join all user inputs into one comma-separated plain text string */
export function joinGroupInputs(inputs: string[]): string {
  return inputs.map((s) => s.trim()).filter(Boolean).join(", ");
}
