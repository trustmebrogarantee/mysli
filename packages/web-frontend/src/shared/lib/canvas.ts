// Кэш для хранения текстур текста на разных уровнях качества
const textureCache: Map<string, OffscreenCanvas> = new Map();

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  font: string = "16px Arial",
  zoomLevel: number = 1
) {
  // Уникальный ключ для кэша
  const baseCacheKey = `${text}_${maxWidth}_${font}`;
  const MIN_ZOOM_THRESHOLD = 0.2; // Минимальный масштаб для качества 0.2
  const ZOOM_STEP = 0.2; // Шаг уменьшения масштаба

  // Проверяем входные параметры
  maxWidth = Math.max(maxWidth, 1);
  lineHeight = Math.max(lineHeight, 1);

  // Функция для разбиения текста на строки
  const getLines = (): string[] => {
    if (!text || text.trim() === "") {
      return [""];
    }
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];
    ctx.font = font;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && line !== "") {
        lines.push(line.trim());
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  };

  // Определяем уровень качества в зависимости от zoomLevel
  const clampedZoom = Math.max(MIN_ZOOM_THRESHOLD, Math.min(1, zoomLevel));
  const qualityStep = Math.round((clampedZoom - MIN_ZOOM_THRESHOLD) / ZOOM_STEP) * ZOOM_STEP + MIN_ZOOM_THRESHOLD;
  const qualityFactor = qualityStep; // Линейное снижение от 1.0 до 0.2
  const cacheKey = `${baseCacheKey}_${qualityFactor}`;

  // Создаем текстуру нужного качества
  let texture = textureCache.get(cacheKey);
  if (!texture) {
    maxWidth = Number.isNaN(maxWidth) ? 1 : maxWidth
    const lines = getLines();
    const scaleFactor = qualityFactor === 1 ? 2 : qualityFactor; // Полное качество (x2) только при zoomLevel >= 1
    const textureWidth = Math.max(Math.round(maxWidth * scaleFactor), 1);
    const textureHeight = Math.max(Math.round(lines.length * lineHeight * scaleFactor), 1);
    
    texture = new OffscreenCanvas(textureWidth, textureHeight);
    const offCtx = texture.getContext("2d")!;
    offCtx.scale(scaleFactor, scaleFactor);
    offCtx.font = font;
    offCtx.fillStyle =  "#000000";
    offCtx.textBaseline = "top";
    for (let i = 0; i < lines.length; i++) {
      offCtx.fillText(lines[i], 0, i * lineHeight);
    }
    textureCache.set(cacheKey, texture);
  }

  // Функция отрисовки
  const render = () => {
    const displayHeight = qualityFactor === 1 ? texture.height / 2 : texture.height / qualityFactor;
    ctx.drawImage(texture!, x, y, maxWidth, displayHeight); // Растягиваем до исходных размеров
  };

  const lines = texture.height / (lineHeight * (qualityFactor === 1 ? 2 : qualityFactor))
  const height = lineHeight * lines 

  return { lines, height, render };
}