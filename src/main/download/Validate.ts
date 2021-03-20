import sha from "sha";

export function validate(file: string, expected: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    sha.check(file, expected, (e) => {
      if (e) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
