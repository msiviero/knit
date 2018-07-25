export interface Entry {
  label: string;
  start: number;
  end: number;
  elapsed: number;
}

/**
 * A global container for the measures
 */
class Manager {

  private entries: Entry[] = [];

  /**
   * Adds an entry to the measures
   * @param entry The entry to add
   */
  public add(entry: Entry) {
    this.entries.push(entry);
  }

  /**
   * Gets all the measures
   * @returns the measures
   */
  public all() {
    return this.entries;
  }

  /**
   * Gets all the measures with a specific label
   * @param label The label
   * @returns the measures
   */
  public byName(label: string) {
    return this.entries.filter((entry) => entry.label === label);
  }

  /**
   * Returns the sum of all the measures with a specific label
   * @param label The label
   * @returns the sum in milliseconds
   */
  public sum(label: string) {
    return this.entries
      .filter((entry) => entry.label === label)
      .reduce((acc, entry) => acc + entry.elapsed, 0);
  }

  /**
   * Returns the average value of all the measures with a specific label
   * @param label The label
   * @returns the sum in milliseconds
   */
  public avg(label: string) {
    const sum = this.entries
      .filter((entry) => entry.label === label)
      .reduce((acc, entry) => acc + entry.elapsed, 0);
    return sum / this.entries.length;
  }

  /**
   * Clears all the measures
   * @param label The label. Optional. If provided clears only the measures with this specific label
   */
  public clear(label?: string) {
    if (!label) {
      this.entries = [];
    } else {
      this.entries = this.entries
        .filter((entry) => entry.label !== label);
    }
  }
}

export const manager = new Manager();

/**
 * A decorator which wraps a method and keeps track of execution time
 * @param label The label
 * @param condition A condition which, if evaluate to false, skips the measure. Default to "true"
 */
export function track(label: string, condition: boolean = true) {
  return (target: object, _: string, descriptor: TypedPropertyDescriptor<any>) => {

    if (!condition) {
      return;
    }

    const originalMethod = descriptor.value!;

    descriptor.value = (...args: any[]) => {
      const start = Date.now();
      const result = originalMethod.apply(target, args);

      if (result instanceof Promise) {
        return result
          .then((value) => {
            const end = Date.now();
            manager.add({ label, start, end, elapsed: end - start });
            return value;
          });
      } else {
        const end = Date.now();
        manager.add({ label, start, end, elapsed: end - start });
        return result;
      }
    };
  };
}
