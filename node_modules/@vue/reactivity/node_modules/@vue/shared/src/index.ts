export function isFunction(val:any) {
  return typeof val === "function";
}
export function isArray(val:any) {
  return Array.isArray(val);
}

export function isObject(val:any) {
  return typeof val === "object" && val !== null;
}
export function isString(val:any) {
  return typeof val == "string";
}

export * from "./shapeFlags";
export * from "./normalizeProp";
