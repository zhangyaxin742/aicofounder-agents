export async function fanOut<T>(
  tasks: Record<string, () => Promise<T>>,
  onRejected: (key: string, reason: unknown) => T
): Promise<Record<string, T>> {
  const entries = Object.entries(tasks);
  const settled = await Promise.allSettled(entries.map(([, task]) => task()));

  return settled.reduce<Record<string, T>>((accumulator, result, index) => {
    const [key] = entries[index];

    if (result.status === "fulfilled") {
      accumulator[key] = result.value;
      return accumulator;
    }

    accumulator[key] = onRejected(key, result.reason);
    return accumulator;
  }, {});
}
