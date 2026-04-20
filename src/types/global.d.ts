// globe.gl is loaded from CDN at runtime — no npm types available
interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Globe: (...args: any[]) => any
}
