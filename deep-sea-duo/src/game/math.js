export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const length = (x, y) => Math.hypot(x, y);
export const normalize = (x, y) => {
  const size = length(x, y);
  return size ? { x: x / size, y: y / size } : { x: 0, y: 0 };
};
export const distanceSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export const circlesTouch = (a, b) => distanceSq(a, b) <= (a.radius + b.radius) ** 2;
export const randomRange = (min, max, random = Math.random) => min + (max - min) * random();
