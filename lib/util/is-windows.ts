/**
 * Returns if the system is a Windows system or not
 * @returns 
 */
export function isWindows() {
    return /^win/.test(globalThis.process ? globalThis.process.platform : "");
}