export function useConfirmation() {
  async function demander(options: { titre?: string; message: string; texteConfirmer?: string; dangereux?: boolean }) {
    // Minimal fallback using the native confirm dialog.
    // Returns true if user confirms, false otherwise.
    return Promise.resolve(confirm(options.message))
  }

  return { demander }
}
