export function parseTimeToMs(timeStr: string): number {
  // Регулярное выражение для извлечения числа и единицы измерения
  const regex = /^(\d+(?:\.\d+)?)\s*([a-z]+)$/i;
  const match = timeStr.match(regex);

  if (!match) {
    throw new Error(
      `Неверный формат времени: "${timeStr}". Ожидается формат вроде '2h', '7d', '30m'.`,
    );
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  let multiplier: number;

  switch (unit) {
    case "s": // секунды
      multiplier = 1000;
      break;
    case "m": // минуты
      multiplier = 60 * 1000;
      break;
    case "h": // часы
      multiplier = 60 * 60 * 1000;
      break;
    case "d": // дни
      multiplier = 24 * 60 * 60 * 1000;
      break;
    case "w": // недели
      multiplier = 7 * 24 * 60 * 60 * 1000;
      break;
    case "mon": // месяцы (усреднённо ~30.44 дня)
      multiplier = 30.44 * 24 * 60 * 60 * 1000;
      break;
    case "y": // годы (усреднённо 365.25 дней)
      multiplier = 365.25 * 24 * 60 * 60 * 1000;
      break;
    default:
      throw new Error(
        `Неизвестная единица времени: "${unit}" в строке "${timeStr}".`,
      );
  }

  if (isNaN(value)) {
    // Это маловероятно из-за регулярного выражения, но на всякий случай
    throw new Error(`Неверное числовое значение в строке: "${timeStr}".`);
  }

  return Math.round(value * multiplier);
}
