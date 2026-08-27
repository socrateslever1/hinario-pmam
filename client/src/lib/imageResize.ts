export type ImageDimensions = {
  width: number;
  height: number;
};

export function fitImageWithinMaxDimension(
  width: number,
  height: number,
  maxDimension: number,
): ImageDimensions {
  if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(maxDimension)) {
    throw new Error("Image dimensions must be finite numbers.");
  }
  if (width <= 0 || height <= 0 || maxDimension <= 0) {
    throw new Error("Image dimensions must be greater than zero.");
  }

  const largestSide = Math.max(width, height);
  if (largestSide <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = maxDimension / largestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
