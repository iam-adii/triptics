/**
 * Browser shim for Node.js os module
 * Provides empty implementations to prevent errors
 */

export default {
  hostname: () => 'browser',
  type: () => 'Browser',
  platform: () => 'browser',
  arch: () => 'browser',
  release: () => '1.0.0',
  networkInterfaces: () => ({}),
  cpus: () => [],
  totalmem: () => 0,
  freemem: () => 0
}; 