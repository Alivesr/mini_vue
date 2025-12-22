export function isFunction(val) {
  return typeof val === "function";
}

export function isObject(val) {
  return typeof val === "object" && val !== null;
}
export function isString(val) {
  return typeof val == "string";
}

export * from "./shapeFlags";
