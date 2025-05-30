/**
 * Browser shim for Node.js stream module
 * Provides empty implementations to prevent errors
 */

export default {
  Readable: class Readable {},
  Writable: class Writable {},
  Transform: class Transform {},
  Duplex: class Duplex {}
}; 