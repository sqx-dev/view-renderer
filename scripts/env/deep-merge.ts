// Slightly modified from https://stackoverflow.com/a/37164538
// Nightmare to try and type this out, since it's just used
// here I'm going to skip it and go with any. Should type it
// at some point though...
export function isObject(item: unknown) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export default function mergeDeep<T>(target: any, source: any): T {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(target).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else if (Array.isArray(source[key])) {
        output[key] = source[key];
      } else if (source[key] !== undefined) {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}
