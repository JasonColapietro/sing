/**
 * The command line every browser script shares:
 *
 *   node e2e/<script>.mjs [baseUrl] [--executable=path] [--name=value ...]
 *
 * argv[0] is the node binary and argv[1] the script; without the slice the
 * first bare argument is the node path, which Chrome cheerfully tries to open.
 */
export function cliArgs(defaultBase, argv = process.argv.slice(2)) {
  /** The value of `--name=value`, or undefined. */
  const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const positional = argv.filter((a) => !a.startsWith("--"));
  return {
    argv,
    positional,
    flag,
    /** True for a bare `--name` switch. */
    has: (name) => argv.includes(`--${name}`),
    /** The first bare argument, else the script's default, without a trailing slash. */
    base: (positional[0] ?? defaultBase).replace(/\/$/, ""),
    /** A browser build Playwright did not install, e.g. `/opt/pw-browsers/chromium` in a cloud container. */
    executable: flag("executable"),
  };
}

/** chromium.launch options for an --executable path, else `fallback` (Chrome by default). */
export function browserTarget(executable, fallback = { channel: "chrome" }) {
  return executable ? { executablePath: executable } : fallback;
}
