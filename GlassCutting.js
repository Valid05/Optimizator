// ============================================
// GlassCutting.js - ПОЛНЫЙ КОД С УМНЫМ ПОИСКОМ
// ============================================

console.log("✅ GlassCutting.js загружен!");

// ==================== БАЗОВЫЕ КЛАССЫ ====================
class Rectangle {
  constructor(width, height, id = null) {
    this.width = width;
    this.height = height;
    this.id = id || `D${Math.floor(Math.random() * 1000)}`;
    this.x = 0;
    this.y = 0;
    this.rotated = false;
    this.placed = false;
  }

  area() {
    return this.width * this.height;
  }
  perimeter() {
    return 2 * (this.width + this.height);
  }
  maxSide() {
    return Math.max(this.width, this.height);
  }
  minSide() {
    return Math.min(this.width, this.height);
  }

  rotate() {
    const rect = new Rectangle(this.height, this.width, this.id);
    rect.rotated = true;
    return rect;
  }

  clone() {
    const rect = new Rectangle(this.width, this.height, this.id);
    rect.x = this.x;
    rect.y = this.y;
    rect.rotated = this.rotated;
    rect.placed = this.placed;
    return rect;
  }
}

class Sheet {
  constructor(width, height, id = 1) {
    this.width = width;
    this.height = height;
    this.id = id;
    this.placedRectangles = [];
    this.freeSpaces = [{ x: 0, y: 0, width, height }];
  }

  placeRectangle(rect, allowRotation = true, strategy = "bottom-left") {
    this.freeSpaces.sort((a, b) => {
      if (strategy === "bottom-left") return a.y - b.y || a.x - b.x;
      if (strategy === "best-area")
        return a.width * a.height - b.width * b.height;
      if (strategy === "best-short-side") {
        return Math.min(a.width, a.height) - Math.min(b.width, b.height);
      }
      return a.y - b.y || a.x - b.x;
    });

    for (let i = 0; i < this.freeSpaces.length; i++) {
      const space = this.freeSpaces[i];
      if (rect.width <= space.width && rect.height <= space.height) {
        return this._placeInSpace(rect, space, i, false);
      }
      if (
        allowRotation &&
        rect.height <= space.width &&
        rect.width <= space.height
      ) {
        const rotated = rect.rotate();
        return this._placeInSpace(rotated, space, i, true);
      }
    }
    return false;
  }

  _placeInSpace(rect, space, index, wasRotated) {
    rect.x = space.x;
    rect.y = space.y;
    rect.placed = true;
    if (wasRotated) rect.rotated = true;

    this.placedRectangles.push(rect);
    this.freeSpaces.splice(index, 1);

    const rightSpace = {
      x: space.x + rect.width,
      y: space.y,
      width: space.width - rect.width,
      height: rect.height,
    };

    const topSpace = {
      x: space.x,
      y: space.y + rect.height,
      width: space.width,
      height: space.height - rect.height,
    };

    if (rightSpace.width > 0 && rightSpace.height > 0)
      this.freeSpaces.push(rightSpace);
    if (topSpace.width > 0 && topSpace.height > 0)
      this.freeSpaces.push(topSpace);

    this._mergeSpaces();
    return true;
  }

  _mergeSpaces() {
    for (let i = this.freeSpaces.length - 1; i >= 0; i--) {
      for (let j = 0; j < this.freeSpaces.length; j++) {
        if (i !== j) {
          const a = this.freeSpaces[i];
          const b = this.freeSpaces[j];
          if (
            a.x >= b.x &&
            a.y >= b.y &&
            a.x + a.width <= b.x + b.width &&
            a.y + a.height <= b.y + b.height
          ) {
            this.freeSpaces.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  // НОВЫЙ МЕТОД: Пытается впихнуть маленькие детали в свободные пространства
  tryFitSmallPieces(smallRects, allowRotation) {
    let fittedCount = 0;

    // Сортируем мелкие детали по площади (убывание) - сначала побольше из мелких
    const sortedSmallRects = [...smallRects]
      .filter((r) => !r.placed)
      .sort((a, b) => b.area() - a.area());

    for (const smallRect of sortedSmallRects) {
      if (smallRect.placed) continue;

      // Ищем подходящее пространство
      let placed = false;

      // Сортируем пространства по площади (возрастание) - сначала маленькие
      this.freeSpaces.sort((a, b) => a.width * a.height - b.width * b.height);

      for (let i = 0; i < this.freeSpaces.length; i++) {
        const space = this.freeSpaces[i];

        // Проверяем обычную ориентацию
        if (
          smallRect.width <= space.width &&
          smallRect.height <= space.height
        ) {
          const rectClone = smallRect.clone();
          if (this._placeInSpace(rectClone, space, i, false)) {
            smallRect.placed = true;
            fittedCount++;
            placed = true;
            break;
          }
        }

        // Проверяем повернутую ориентацию
        if (
          allowRotation &&
          smallRect.height <= space.width &&
          smallRect.width <= space.height
        ) {
          const rotatedRect = smallRect.rotate();
          if (this._placeInSpace(rotatedRect, space, i, true)) {
            smallRect.placed = true;
            fittedCount++;
            placed = true;
            break;
          }
        }
      }

      if (placed) {
        // После успешного размещения снова сортируем пространства
        this.freeSpaces.sort((a, b) => a.width * a.height - b.width * b.height);
      }
    }

    return fittedCount;
  }

  getUtilization() {
    const usedArea = this.placedRectangles.reduce(
      (sum, rect) => sum + rect.area(),
      0,
    );
    const totalArea = this.width * this.height;
    const wasteArea = this.freeSpaces.reduce(
      (sum, space) => sum + space.width * space.height,
      0,
    );

    return {
      percentage: ((usedArea / totalArea) * 100).toFixed(2),
      usedArea: usedArea,
      totalArea: totalArea,
      wasteArea: wasteArea,
      wastePercent: ((wasteArea / totalArea) * 100).toFixed(2),
    };
  }

  clone() {
    const sheet = new Sheet(this.width, this.height, this.id);
    sheet.placedRectangles = this.placedRectangles.map((r) => r.clone());
    sheet.freeSpaces = JSON.parse(JSON.stringify(this.freeSpaces));
    return sheet;
  }
}

// ==================== ОПТИМИЗАТОР ====================
class GlassCuttingOptimizer {
  constructor(sheetWidth, sheetHeight) {
    this.sheetWidth = sheetWidth;
    this.sheetHeight = sheetHeight;
    this.progressCallback = null;
  }

  onProgress(callback) {
    this.progressCallback = callback;
  }

  updateProgress(percent, message) {
    if (this.progressCallback) {
      this.progressCallback(percent, message);
    }
  }

  // ==================== УМНЫЙ ПОИСК ЛУЧШЕГО ====================
  smartAutoOptimize(parts, allowRotation = true) {
    console.log("🧠 Запуск умного авто-поиска...");
    this.updateProgress(10, "Анализ задачи...");

    const count = parts.length;

    // ВСЕГДА тестируем ВСЕ алгоритмы для умного поиска!
    const algorithmsToTest = ["greedy", "parallel", "genetic", "annealing"];

    console.log(`Тестируем алгоритмы: ${algorithmsToTest.join(", ")}`);

    const results = [];
    const algorithmNames = {
      greedy: "⚡ Быстрый",
      parallel: "🔄 Параллельный",
      genetic: "🧬 Генетический",
      annealing: "🔥 Имитация отжига",
    };

    // Тестируем каждый алгоритм
    algorithmsToTest.forEach((algorithm, index) => {
      const progressStep = 80 / algorithmsToTest.length;
      const startProgress = 15 + index * progressStep;

      this.updateProgress(startProgress, `Тест: ${algorithmNames[algorithm]}`);

      let result;
      const startTime = Date.now();

      try {
        switch (algorithm) {
          case "genetic":
            result = this.geneticOptimize(parts, allowRotation, {
              populationSize: Math.min(20, Math.max(10, Math.floor(count / 2))),
              generations: Math.min(40, Math.max(20, count)),
              mutationRate: 0.15,
            });
            break;
          case "annealing":
            result = this.simulatedAnnealingOptimize(parts, allowRotation, {
              initialTemperature: 1200,
              coolingRate: 0.96,
              iterations: Math.min(2000, count * 100),
            });
            break;
          case "parallel":
            result = this.parallelOptimize(parts, allowRotation);
            break;
          case "greedy":
          default:
            result = this.greedyOptimize(parts, allowRotation);
        }

        const timeTaken = Date.now() - startTime;

        results.push({
          algorithm: algorithm,
          name: algorithmNames[algorithm],
          waste: parseFloat(result.wastePercentage),
          sheets: result.totalSheets,
          efficiency: parseFloat(result.efficiency),
          timeTaken: timeTaken,
          result: result,
        });

        console.log(
          `${algorithmNames[algorithm]}: ${result.wastePercentage}% отходов, ${result.totalSheets} листов, ${timeTaken}ms`,
        );
      } catch (error) {
        console.error(`Ошибка в алгоритме ${algorithm}:`, error);
      }
    });

    // Находим лучший результат
    if (results.length === 0) {
      return this.greedyOptimize(parts, allowRotation);
    }

    // Сортируем по отходам (меньше = лучше), затем по количеству листов
    results.sort((a, b) => {
      if (a.waste !== b.waste) return a.waste - b.waste;
      if (a.sheets !== b.sheets) return a.sheets - b.sheets;
      return a.timeTaken - b.timeTaken;
    });

    const best = results[0];
    const secondBest = results[1] || best;

    // Формируем строку сравнения
    let comparisonText = "Сравнение алгоритмов:\n";
    results.forEach((r, i) => {
      comparisonText += `${i + 1}. ${r.name}: ${r.waste}% отходов, ${r.sheets} листов, ${r.timeTaken}ms\n`;
    });

    console.log(comparisonText);
    console.log(`🏆 Лучший: ${best.name} с ${best.waste}% отходов`);

    let reason;
    const wasteDiff = secondBest.waste - best.waste;

    if (best.algorithm === "parallel" && wasteDiff > 3) {
      reason = `Параллельный алгоритм значительно лучше других (на ${wasteDiff.toFixed(1)}% меньше отходов)`;
    } else if (best.algorithm === "greedy") {
      reason =
        "Быстрый алгоритм показал лучший результат (самый эффективный для этой задачи)";
    } else if (best.algorithm === "genetic") {
      reason =
        "Генетический алгоритм нашёл оптимальное решение для сложных форм";
    } else if (best.algorithm === "annealing") {
      reason = "Имитация отжига дала лучшую плотность упаковки";
    } else if (wasteDiff > 0.5) {
      reason = `${best.name} показал лучший результат среди всех тестируемых алгоритмов`;
    } else {
      reason = `Несколько алгоритмов дали схожие результаты, выбран ${best.name} как самый быстрый`;
    }

    // Создаём таблицу сравнения для отображения
    const comparisonTable = results
      .map(
        (r) =>
          `<tr ${r === best ? 'style="background: rgba(144, 238, 144, 0.2);"' : ""}>
            <td>${r.name}</td>
            <td>${r.waste.toFixed(2)}%</td>
            <td>${r.sheets}</td>
            <td>${r.efficiency.toFixed(2)}%</td>
            <td>${r.timeTaken}ms</td>
        </tr>`,
      )
      .join("");

    best.result.autoSelection = {
      algorithm: best.algorithm,
      name: best.name,
      reason: reason,
      partsCount: count,
      actualSheets: best.sheets,
      waste: best.waste,
      efficiency: best.efficiency,
      timeTaken: best.timeTaken,
      comparisonTable: comparisonTable,
      testedAlgorithms: results.length,
      allResults: results.map((r) => `${r.name}: ${r.waste.toFixed(2)}%`),
    };

    this.updateProgress(100, "Умный поиск завершен!");
    return best.result;
  }

  // ==================== УМНЫЙ АВТО-ВЫБОР ====================
  autoOptimize(parts, allowRotation = true) {
    console.log("🚀 Запуск авто-выбора алгоритма...");
    this.updateProgress(10, "Анализ задачи...");

    const count = parts.length;
    const totalArea = parts.reduce((sum, size) => {
      const [w, h] = size.split("x").map(Number);
      return sum + w * h;
    }, 0);

    const sheetArea = this.sheetWidth * this.sheetHeight;
    const estimatedSheets = Math.ceil(totalArea / sheetArea);

    // АНАЛИЗ СЛОЖНОСТИ
    let complexityScore = 0;
    let hasLargeParts = false;
    let hasSmallParts = false;

    parts.forEach((size) => {
      const [w, h] = size.split("x").map(Number);
      const ratio = Math.max(w, h) / Math.min(w, h);
      const area = w * h;

      if (ratio > 3) complexityScore += 3;
      else if (ratio > 2) complexityScore += 2;
      else if (ratio > 1.5) complexityScore += 1;

      if (area > sheetArea * 0.4) hasLargeParts = true;
      if (area < sheetArea * 0.1) hasSmallParts = true;
    });

    // УЛУЧШЕННАЯ ЛОГИКА ВЫБОРА
    let selectedAlgorithm;
    let reason;

    if (count <= 5) {
      selectedAlgorithm = "greedy";
      reason = "Мало деталей (≤5) → Быстрый алгоритм";
    } else if (count <= 15 && hasLargeParts && hasSmallParts) {
      selectedAlgorithm = "parallel";
      reason = "Смешанные размеры деталей → Параллельная оптимизация";
    } else if (complexityScore > count * 1.5) {
      selectedAlgorithm = "genetic";
      reason = "Много вытянутых деталей → Генетический алгоритм";
    } else if (count <= 15) {
      selectedAlgorithm = "parallel";
      reason =
        "Среднее количество деталей → Параллельная оптимизация (самый надежный)";
    } else if (count <= 25) {
      selectedAlgorithm = "annealing";
      reason = "Много деталей (16-25) → Имитация отжига";
    } else {
      selectedAlgorithm = "parallel";
      reason = "Очень много деталей (>25) → Параллельная оптимизация";
    }

    // ГАРАНТИЯ: Если parallel может быть лучше, проверяем его
    if (selectedAlgorithm !== "parallel" && count <= 20) {
      reason += " (с проверкой параллельного алгоритма)";
    }

    this.updateProgress(30, reason);
    console.log(`🤖 Авто-выбор: ${selectedAlgorithm} | Деталей: ${count}`);

    // Запускаем выбранный алгоритм
    let result;
    const startTime = Date.now();

    switch (selectedAlgorithm) {
      case "genetic":
        result = this.geneticOptimize(parts, allowRotation, {
          populationSize: Math.min(25, Math.max(12, Math.floor(count / 1.5))),
          generations: Math.min(50, Math.max(25, count * 1.5)),
          mutationRate: 0.15,
        });
        break;
      case "annealing":
        result = this.simulatedAnnealingOptimize(parts, allowRotation, {
          initialTemperature: 1200,
          coolingRate: 0.96,
          iterations: Math.min(2500, count * 120),
        });
        break;
      case "parallel":
        result = this.parallelOptimize(parts, allowRotation);
        break;
      case "greedy":
      default:
        result = this.greedyOptimize(parts, allowRotation);
    }

    let timeTaken = Date.now() - startTime;

    // ПРОВЕРКА: Если не parallel, проверяем его для сравнения
    if (selectedAlgorithm !== "parallel" && count <= 20) {
      this.updateProgress(
        70,
        "Проверка параллельного алгоритма для сравнения...",
      );

      const parallelStart = Date.now();
      const parallelResult = this.parallelOptimize(parts, allowRotation);
      const parallelTime = Date.now() - parallelStart;

      const currentWaste = parseFloat(result.wastePercentage);
      const parallelWaste = parseFloat(parallelResult.wastePercentage);

      console.log(
        `Сравнение: ${selectedAlgorithm}=${currentWaste}% vs parallel=${parallelWaste}%`,
      );

      // Если parallel лучше на 1.5% и более, используем его
      if (parallelWaste + 1.5 < currentWaste) {
        result = parallelResult;
        selectedAlgorithm = "parallel";
        reason = `Автоматически выбран параллельный алгоритм (лучше на ${(currentWaste - parallelWaste).toFixed(1)}%)`;
        timeTaken += parallelTime;

        console.log(
          `✅ Авто-коррекция: выбрали parallel (${parallelWaste}%) вместо ${selectedAlgorithm} (${currentWaste}%)`,
        );
      }
    }

    // Добавляем информацию о выборе
    result.autoSelection = {
      algorithm: selectedAlgorithm,
      reason: reason,
      partsCount: count,
      estimatedSheets: estimatedSheets,
      actualSheets: result.totalSheets,
      waste: parseFloat(result.wastePercentage),
      efficiency: parseFloat(result.efficiency),
      timeTaken: timeTaken,
      complexityScore: complexityScore,
    };

    console.log(`✅ Авто-режим завершен за ${timeTaken}ms`);
    return result;
  }

  // 1. ЖАДНЫЙ АЛГОРИТМ С УПАКОВКОЙ МЕЛКИХ ДЕТАЛЕЙ
  greedyOptimize(parts, allowRotation = true) {
    console.log("⚡ Запуск улучшенного жадного алгоритма...");
    this.updateProgress(10, "Сортировка деталей...");

    const rects = parts.map((size, i) => {
      const [w, h] = size.split("x").map(Number);
      return new Rectangle(w, h, `D${i + 1}`);
    });

    // УЛУЧШЕННАЯ СОРТИРОВКА: сначала сложные, потом большие
    rects.sort((a, b) => {
      // Детали с большим соотношением сторон сложнее упаковать
      const aspectRatioA =
        Math.max(a.width, a.height) / Math.min(a.width, a.height);
      const aspectRatioB =
        Math.max(b.width, b.height) / Math.min(b.width, b.height);

      // Если одна деталь значительно более вытянутая
      if (Math.abs(aspectRatioB - aspectRatioA) > 2) {
        return aspectRatioB - aspectRatioA;
      }

      // Иначе сортируем по площади (убывание)
      return b.area() - a.area();
    });

    this.updateProgress(30, "Укладка деталей с оптимизацией пространства...");
    const sheets = [new Sheet(this.sheetWidth, this.sheetHeight, 1)];

    // Разделяем детали на большие и мелкие
    const largeRects = [];
    const smallRects = [];
    const sheetArea = this.sheetWidth * this.sheetHeight;

    rects.forEach((rect) => {
      if (rect.area() > sheetArea * 0.25) {
        // Больше 25% листа
        largeRects.push(rect);
      } else {
        smallRects.push(rect);
      }
    });

    console.log(
      `Больших деталей: ${largeRects.length}, мелких: ${smallRects.length}`,
    );

    // 1. Сначала размещаем ВСЕ большие детали
    for (let i = 0; i < largeRects.length; i++) {
      const rect = largeRects[i];
      let placed = false;

      for (const sheet of sheets) {
        if (sheet.placeRectangle(rect.clone(), allowRotation, "best-area")) {
          placed = true;

          // ПОСЛЕ размещения большой детали - пытаемся впихнуть мелкие
          // в образовавшееся пространство ЭТОГО ЖЕ ЛИСТА
          const availableSmallRects = smallRects.filter((r) => !r.placed);
          if (availableSmallRects.length > 0) {
            sheet.tryFitSmallPieces(availableSmallRects, allowRotation);
          }

          break;
        }
      }

      if (!placed) {
        const newSheet = new Sheet(
          this.sheetWidth,
          this.sheetHeight,
          sheets.length + 1,
        );
        newSheet.placeRectangle(rect.clone(), allowRotation, "best-area");
        sheets.push(newSheet);
      }

      this.updateProgress(
        30 + (i / largeRects.length) * 40,
        `Большие детали: ${i + 1}/${largeRects.length}`,
      );
    }

    // 2. Затем размещаем ОСТАВШИЕСЯ мелкие детали
    const remainingSmallRects = smallRects.filter((r) => !r.placed);
    this.updateProgress(
      70,
      `Размещение ${remainingSmallRects.length} мелких деталей...`,
    );

    for (let i = 0; i < remainingSmallRects.length; i++) {
      const rect = remainingSmallRects[i];
      let placed = false;

      // Пробуем разместить на существующих листах
      for (const sheet of sheets) {
        if (
          sheet.placeRectangle(rect.clone(), allowRotation, "best-short-side")
        ) {
          placed = true;
          break;
        }
      }

      if (!placed) {
        // Для мелкой детали создаем новый лист, но используем bottom-left
        const newSheet = new Sheet(
          this.sheetWidth,
          this.sheetHeight,
          sheets.length + 1,
        );
        newSheet.placeRectangle(rect.clone(), allowRotation, "bottom-left");
        sheets.push(newSheet);
      }

      if (i % 5 === 0) {
        this.updateProgress(
          70 + (i / remainingSmallRects.length) * 25,
          `Мелкие детали: ${i + 1}/${remainingSmallRects.length}`,
        );
      }
    }

    // 3. ФИНАЛЬНАЯ ОПТИМИЗАЦИЯ: пытаемся переупаковать
    this.updateProgress(95, "Финальная оптимизация упаковки...");

    // Для каждого листа пытаемся впихнуть оставшиеся мелкие детали
    const allUnplaced = [...smallRects, ...largeRects].filter((r) => !r.placed);
    if (allUnplaced.length > 0) {
      for (const sheet of sheets) {
        const fitted = sheet.tryFitSmallPieces(allUnplaced, allowRotation);
        if (fitted > 0) {
          console.log(
            `На листе ${sheet.id} дополнительно размещено ${fitted} деталей`,
          );
        }
      }
    }

    this.updateProgress(100, "Завершено!");
    return this._calculateResults(sheets, "⚡ Улучшенный жадный алгоритм");
  }

  // 2. ГЕНЕТИЧЕСКИЙ АЛГОРИТМ
  geneticOptimize(parts, allowRotation = true, options = {}) {
    console.log("🧬 Запуск генетического алгоритма...");
    const {
      populationSize = 20,
      generations = 40,
      mutationRate = 0.15,
    } = options;

    this.updateProgress(5, "Создание начальной популяции...");

    const rects = parts.map((size, i) => {
      const [w, h] = size.split("x").map(Number);
      return new Rectangle(w, h, `D${i + 1}`);
    });

    let population = [];
    for (let i = 0; i < populationSize; i++) {
      if (i % 4 === 0) {
        population.push([...rects].sort(() => Math.random() - 0.5));
      } else if (i % 4 === 1) {
        population.push([...rects].sort((a, b) => b.width - a.width));
      } else if (i % 4 === 2) {
        population.push([...rects].sort((a, b) => b.height - a.height));
      } else {
        population.push([...rects].sort((a, b) => b.area() - a.area()));
      }
    }

    let bestIndividual = null;
    let bestFitness = -Infinity;

    for (let gen = 0; gen < generations; gen++) {
      const fitnessScores = [];
      for (let i = 0; i < population.length; i++) {
        const fitness = this._evaluateIndividual(population[i], allowRotation);
        fitnessScores.push({ individual: population[i], fitness });

        if (fitness > bestFitness) {
          bestFitness = fitness;
          bestIndividual = population[i];
        }
      }

      fitnessScores.sort((a, b) => b.fitness - a.fitness);

      const newPopulation = [];
      const eliteCount = Math.max(2, Math.floor(populationSize * 0.1));

      for (let i = 0; i < eliteCount; i++) {
        newPopulation.push(fitnessScores[i].individual);
      }

      while (newPopulation.length < populationSize) {
        const parent1 = this._tournamentSelection(fitnessScores);
        const parent2 = this._tournamentSelection(fitnessScores);
        let child = this._crossover(parent1, parent2);

        if (Math.random() < mutationRate) {
          child = this._mutate(child);
        }

        newPopulation.push(child);
      }

      population = newPopulation;

      this.updateProgress(
        5 + (gen / generations) * 90,
        `Генетический: поколение ${gen + 1}/${generations}, эффективность: ${(bestFitness * 100).toFixed(1)}%`,
      );

      if (bestFitness > 0.99) break;
    }

    this.updateProgress(95, "Формирование результата...");
    const result = this._packRectangles(
      bestIndividual.map((r) => `${r.width}x${r.height}`),
      allowRotation,
      "best-area",
    );

    result.algorithm = "🧬 Генетический алгоритм";
    result.bestFitness = bestFitness;

    this.updateProgress(100, "Готово!");
    return result;
  }

  // 3. ИМИТАЦИЯ ОТЖИГА
  simulatedAnnealingOptimize(parts, allowRotation = true, options = {}) {
    console.log("🔥 Запуск имитации отжига...");
    const {
      initialTemperature = 1200,
      coolingRate = 0.96,
      iterations = 2000,
    } = options;

    const rects = parts.map((size, i) => {
      const [w, h] = size.split("x").map(Number);
      return new Rectangle(w, h, `D${i + 1}`);
    });

    let currentSolution = [...rects].sort(() => Math.random() - 0.5);
    let currentEnergy =
      1 - this._evaluateIndividual(currentSolution, allowRotation);
    let bestSolution = currentSolution;
    let bestEnergy = currentEnergy;

    let temperature = initialTemperature;

    for (let i = 0; i < iterations; i++) {
      const neighbor = this._getAnnealingNeighbor(currentSolution);
      const neighborEnergy =
        1 - this._evaluateIndividual(neighbor, allowRotation);

      const delta = neighborEnergy - currentEnergy;
      if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
        currentSolution = neighbor;
        currentEnergy = neighborEnergy;
      }

      if (currentEnergy < bestEnergy) {
        bestSolution = currentSolution;
        bestEnergy = currentEnergy;
      }

      temperature *= coolingRate;

      if (i % 100 === 0) {
        this.updateProgress(
          (i / iterations) * 100,
          `Имитация отжига: ${i}/${iterations}, темп: ${temperature.toFixed(1)}`,
        );
      }

      if (temperature < 1) break;
    }

    const result = this._packRectangles(
      bestSolution.map((r) => `${r.width}x${r.height}`),
      allowRotation,
      "best-short-side",
    );

    result.algorithm = "🔥 Имитация отжига";
    result.energy = bestEnergy;

    return result;
  }

  // 4. ПАРАЛЛЕЛЬНАЯ ОПТИМИЗАЦИЯ
  parallelOptimize(parts, allowRotation = true) {
    console.log("🔄 Запуск параллельной оптимизации...");

    const strategies = [
      {
        name: "По площади",
        sort: (a, b) => b.area() - a.area(),
        placement: "bottom-left",
      },
      {
        name: "По ширине",
        sort: (a, b) => b.width - a.width,
        placement: "best-area",
      },
      {
        name: "По высоте",
        sort: (a, b) => b.height - a.height,
        placement: "best-short-side",
      },
      {
        name: "По периметру",
        sort: (a, b) => b.perimeter() - a.perimeter(),
        placement: "bottom-left",
      },
      {
        name: "По макс.стороне",
        sort: (a, b) => b.maxSide() - a.maxSide(),
        placement: "best-area",
      },
      {
        name: "Случайная",
        sort: () => Math.random() - 0.5,
        placement: "best-short-side",
      },
    ];

    let bestResult = null;
    let bestScore = -Infinity;

    strategies.forEach((strategy, index) => {
      this.updateProgress(
        (index / strategies.length) * 100,
        `Параллельный: ${strategy.name}`,
      );

      const rects = parts.map((size, i) => {
        const [w, h] = size.split("x").map(Number);
        return new Rectangle(w, h, `D${i + 1}`);
      });

      const sorted = [...rects].sort(strategy.sort);
      const result = this._packRectangles(
        sorted.map((r) => `${r.width}x${r.height}`),
        allowRotation,
        strategy.placement,
      );

      const score = result.totalUsedArea / result.totalArea;
      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          ...result,
          algorithm: `🔄 Параллельный (${strategy.name})`,
        };
      }
    });

    this.updateProgress(100, "Параллельная оптимизация завершена!");
    return bestResult;
  }

  // 5. BEST FIT АЛГОРИТМ (ОПЦИОНАЛЬНО)
  bestFitOptimize(parts, allowRotation = true) {
    console.log("🎯 Запуск Best Fit алгоритма...");

    const rects = parts.map((size, i) => {
      const [w, h] = size.split("x").map(Number);
      return new Rectangle(w, h, `D${i + 1}`);
    });

    // Сортируем по сложности упаковки
    rects.sort((a, b) => {
      const aspectRatioA =
        Math.max(a.width, a.height) / Math.min(a.width, a.height);
      const aspectRatioB =
        Math.max(b.width, b.height) / Math.min(b.width, b.height);
      return aspectRatioB - aspectRatioA || b.area() - a.area();
    });

    const sheets = [new Sheet(this.sheetWidth, this.sheetHeight, 1)];

    for (const rect of rects) {
      let bestSheet = null;
      let bestSpaceIndex = -1;
      let bestRotated = false;
      let bestFitScore = -Infinity;

      // Ищем лучшее место среди всех листов
      for (const sheet of sheets) {
        for (let i = 0; i < sheet.freeSpaces.length; i++) {
          const space = sheet.freeSpaces[i];

          // Проверяем обычную ориентацию
          if (rect.width <= space.width && rect.height <= space.height) {
            const wasteWidth = space.width - rect.width;
            const wasteHeight = space.height - rect.height;
            const score = rect.area() - (wasteWidth + wasteHeight) * 10;

            if (score > bestFitScore) {
              bestFitScore = score;
              bestSheet = sheet;
              bestSpaceIndex = i;
              bestRotated = false;
            }
          }

          // Проверяем повернутую ориентацию
          if (
            allowRotation &&
            rect.height <= space.width &&
            rect.width <= space.height
          ) {
            const wasteWidth = space.width - rect.height;
            const wasteHeight = space.height - rect.width;
            const score = rect.area() - (wasteWidth + wasteHeight) * 10;

            if (score > bestFitScore) {
              bestFitScore = score;
              bestSheet = sheet;
              bestSpaceIndex = i;
              bestRotated = true;
            }
          }
        }
      }

      if (bestSheet) {
        const rectToPlace = bestRotated ? rect.rotate() : rect.clone();
        // Используем специальную стратегию для точного размещения
        const space = bestSheet.freeSpaces[bestSpaceIndex];
        bestSheet._placeInSpace(
          rectToPlace,
          space,
          bestSpaceIndex,
          bestRotated,
        );

        // После размещения - пытаемся впихнуть мелкие
        const remainingSmall = rects.filter(
          (r) =>
            !r.placed &&
            r !== rect &&
            r.area() < this.sheetWidth * this.sheetHeight * 0.2,
        );
        bestSheet.tryFitSmallPieces(remainingSmall, allowRotation);
      } else {
        const newSheet = new Sheet(
          this.sheetWidth,
          this.sheetHeight,
          sheets.length + 1,
        );
        newSheet.placeRectangle(rect.clone(), allowRotation, "bottom-left");
        sheets.push(newSheet);
      }
    }

    return this._calculateResults(sheets, "🎯 Best Fit алгоритм");
  }

  // ОСНОВНОЙ МЕТОД
  optimize(parts, allowRotation = true, algorithm = "smart") {
    console.log(`🔧 Алгоритм: ${algorithm}, деталей: ${parts.length}`);

    switch (algorithm) {
      case "smart":
        return this.smartAutoOptimize(parts, allowRotation);
      case "auto":
        return this.autoOptimize(parts, allowRotation);
      case "genetic":
        return this.geneticOptimize(parts, allowRotation);
      case "annealing":
        return this.simulatedAnnealingOptimize(parts, allowRotation);
      case "parallel":
        return this.parallelOptimize(parts, allowRotation);
      case "bestfit":
        return this.bestFitOptimize(parts, allowRotation);
      case "greedy":
      default:
        return this.greedyOptimize(parts, allowRotation);
    }
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================
  _evaluateIndividual(individual, allowRotation) {
    const result = this._packRectangles(
      individual.map((r) => `${r.width}x${r.height}`),
      allowRotation,
      "best-area",
    );
    return result.totalUsedArea / result.totalArea;
  }

  _tournamentSelection(fitnessScores, tournamentSize = 3) {
    let best = null;
    let bestFitness = -Infinity;

    for (let i = 0; i < tournamentSize; i++) {
      const candidate =
        fitnessScores[Math.floor(Math.random() * fitnessScores.length)];
      if (candidate.fitness > bestFitness) {
        bestFitness = candidate.fitness;
        best = candidate.individual;
      }
    }

    return best;
  }

  _crossover(parent1, parent2) {
    const point = Math.floor(Math.random() * parent1.length);
    const child = parent1.slice(0, point);

    for (const rect of parent2) {
      if (!child.some((r) => r.id === rect.id)) {
        child.push(rect);
      }
    }

    return child;
  }

  _mutate(individual) {
    const mutated = [...individual];
    const i = Math.floor(Math.random() * mutated.length);
    const j = Math.floor(Math.random() * mutated.length);

    if (i !== j) {
      [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    }

    return mutated;
  }

  _getAnnealingNeighbor(solution) {
    const neighbor = [...solution];
    const swaps = Math.floor(Math.random() * 2) + 1;

    for (let s = 0; s < swaps; s++) {
      const i = Math.floor(Math.random() * neighbor.length);
      const j = Math.floor(Math.random() * neighbor.length);

      if (i !== j) {
        [neighbor[i], neighbor[j]] = [neighbor[j], neighbor[i]];
      }
    }

    return neighbor;
  }

  _packRectangles(parts, allowRotation, placementStrategy = "bottom-left") {
    const sheets = [new Sheet(this.sheetWidth, this.sheetHeight, 1)];

    for (const size of parts) {
      const [width, height] = size.split("x").map(Number);
      const rect = new Rectangle(width, height);

      let placed = false;
      for (const sheet of sheets) {
        if (
          sheet.placeRectangle(rect.clone(), allowRotation, placementStrategy)
        ) {
          placed = true;
          break;
        }
      }

      if (!placed) {
        const newSheet = new Sheet(
          this.sheetWidth,
          this.sheetHeight,
          sheets.length + 1,
        );
        newSheet.placeRectangle(rect.clone(), allowRotation, placementStrategy);
        sheets.push(newSheet);
      }
    }

    return this._calculateResults(sheets);
  }

  _calculateResults(sheets, algorithm = "⚡ Быстрый алгоритм") {
    let totalArea = 0;
    let totalUsedArea = 0;
    let totalWaste = 0;

    sheets.forEach((sheet) => {
      const util = sheet.getUtilization();
      totalArea += util.totalArea;
      totalUsedArea += util.usedArea;
      totalWaste += util.wasteArea;
    });

    return {
      sheets: sheets,
      totalSheets: sheets.length,
      wastePercentage: ((totalWaste / totalArea) * 100).toFixed(2),
      allWastePercentage: ((totalWaste / totalArea) * 100).toFixed(2),
      totalUsedArea: totalUsedArea,
      totalArea: totalArea,
      totalWasteArea: totalWaste,
      efficiency: ((totalUsedArea / totalArea) * 100).toFixed(2),
      algorithm: algorithm,
    };
  }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================

window.loadExample = function () {
  console.log("Загружаем сложный пример...");
  const example = `259x31
248x42
237x53
226x64
215x75
204x86
193x97
182x108
171x119
160x130
149x141
138x152
127x163
116x174
105x185
94x196
83x207
72x218
61x229
50x240
39x251
28x262
17x273
6x284
255x35
244x46
233x57
222x68
211x79
200x90`;
  document.getElementById("partsInput").value = example;
  return "Сложный пример загружен!";
};

window.clearAll = function () {
  console.log("Очищаем форму...");
  document.getElementById("partsInput").value = "";
  document.getElementById("results").style.display = "none";
  document.getElementById("initialState").style.display = "block";
  document.getElementById("algorithmInfo").style.display = "none";
  return "Очищено!";
};

window.parseParts = function (input) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => line.includes("x") || line.includes("×"))
    .map((line) => line.replace("×", "x").toLowerCase());
};

window.getColorForPart = function (id) {
  const colors = [
    "#4a6fa5",
    "#6a5acd",
    "#20b2aa",
    "#ff7f50",
    "#9370db",
    "#3cb371",
    "#ff6347",
    "#4682b4",
    "#9acd32",
    "#daa520",
    "#5f9ea0",
    "#d2691e",
    "#6495ed",
    "#dc143c",
    "#00ced1",
  ];
  const index = parseInt(id.replace("D", "")) || 0;
  return colors[index % colors.length];
};

// Функция для создания легенды цветов
window.createColorLegend = function (partsCount) {
  const legendContainer = document.createElement("div");
  legendContainer.className = "color-legend-container";

  let legendHTML = '<h4>🎨 Легенда деталей</h4><div class="legend-items">';

  // Создаем до 15 элементов легенды (или меньше, если деталей меньше)
  const maxLegendItems = Math.min(partsCount, 15);

  for (let i = 0; i < maxLegendItems; i++) {
    const partId = `D${i + 1}`;
    const color = getColorForPart(partId);
    legendHTML += `
      <div class="legend-item" style="cursor: pointer;" onclick="highlightPart('${partId}')">
        <div class="legend-color" style="background: ${color};"></div>
        <span class="legend-text">${partId}</span>
      </div>
    `;
  }

  legendHTML += "</div>";
  legendContainer.innerHTML = legendHTML;
  return legendContainer;
};

// Функция для подсветки детали
window.highlightPart = function (partId) {
  const allPieces = document.querySelectorAll(".glass-piece");
  allPieces.forEach((piece) => {
    const idElement = piece.querySelector(".piece-id");
    if (idElement && idElement.textContent === partId) {
      piece.style.zIndex = "100";
      piece.style.transform = "scale(1.05)";
      piece.style.boxShadow =
        "0 0 20px gold, inset 0 0 30px rgba(255, 255, 255, 0.8)";
      piece.style.border = "3px solid gold";

      // Сбрасываем подсветку через 3 секунды
      setTimeout(() => {
        piece.style.zIndex = "3";
        piece.style.transform = "scale(1)";
        piece.style.boxShadow =
          "inset 0 0 25px rgba(255, 255, 255, 0.5), 0 8px 20px rgba(0, 0, 0, 0.4)";
        piece.style.border = "3px solid rgba(0, 0, 0, 0.8)";
      }, 3000);
    }
  });
};

// ГЛАВНАЯ ФУНКЦИЯ РАСЧЕТА
window.calculateOptimization = function () {
  console.log("Начало расчета оптимизации...");

  try {
    const sheetWidth =
      parseInt(document.getElementById("sheetWidth").value) || 260;
    const sheetHeight =
      parseInt(document.getElementById("sheetHeight").value) || 180;
    const partsInput = document.getElementById("partsInput").value;
    const allowRotation = document.getElementById("allowRotation").checked;
    const algorithm = document.querySelector(
      'input[name="algorithm"]:checked',
    ).value;

    console.log(
      `Параметры: ${sheetWidth}x${sheetHeight}, алгоритм: ${algorithm}, поворот: ${allowRotation}`,
    );

    const parts = window.parseParts(partsInput);
    console.log(`Найдено деталей: ${parts.length}`, parts);

    if (parts.length === 0) {
      alert("❌ Пожалуйста, введите детали в формате: ширинаxвысота");
      return;
    }

    document.getElementById("loading").style.display = "block";
    document.getElementById("results").style.display = "none";
    document.getElementById("initialState").style.display = "none";

    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const progressStatus = document.getElementById("progressStatus");

    const updateProgress = (percent, message) => {
      if (progressBar) {
        progressBar.style.width = percent + "%";
        progressBar.textContent = Math.round(percent) + "%";
      }
      if (progressText) progressText.textContent = Math.round(percent) + "%";
      if (progressStatus) progressStatus.textContent = message;
    };

    updateProgress(10, "Инициализация...");

    setTimeout(() => {
      try {
        const optimizer = new GlassCuttingOptimizer(sheetWidth, sheetHeight);
        optimizer.onProgress(updateProgress);

        updateProgress(
          30,
          algorithm === "smart"
            ? "🧠 Тестируем все алгоритмы..."
            : `Запуск: ${algorithm}`,
        );
        const result = optimizer.optimize(parts, allowRotation, algorithm);
        console.log("Результат получен:", result);

        updateSummary(result);
        displaySheets(result.sheets, parts.length);

        // ОТОБРАЖЕНИЕ ИНФОРМАЦИИ О АВТО-ВЫБОРЕ
        const algorithmInfo = document.getElementById("algorithmInfo");
        if (algorithmInfo) {
          let algoName, algoDescription;

          if (algorithm === "smart" && result.autoSelection) {
            const auto = result.autoSelection;

            // Создаем массив результатов для таблицы сравнения
            const allResults = [];
            if (auto.allResults && auto.allResults.length > 0) {
              auto.allResults.forEach((resultStr) => {
                const parts = resultStr.split(":");
                if (parts.length >= 2) {
                  const name = parts[0].trim();
                  const wasteStr = parts[1].trim();
                  const waste = parseFloat(wasteStr.replace("%", ""));

                  // Ищем дополнительную информацию в autoSelection
                  let sheets = auto.actualSheets;
                  let time = auto.timeTaken;
                  let efficiency = 100 - waste;

                  // Если есть больше данных в autoSelection
                  if (auto.comparisonResults) {
                    const algoData = auto.comparisonResults.find(
                      (r) => r.name === name,
                    );
                    if (algoData) {
                      sheets = algoData.sheets || sheets;
                      time = algoData.time || time;
                      efficiency = algoData.efficiency || efficiency;
                    }
                  }

                  allResults.push({
                    name: name,
                    waste: waste,
                    sheets: sheets,
                    time: time,
                    efficiency: efficiency,
                  });
                }
              });
            }

            // Если нет данных в allResults, создаем на основе известной информации
            if (allResults.length === 0) {
              allResults.push({
                name: auto.name,
                waste: auto.waste,
                sheets: auto.actualSheets,
                time: auto.timeTaken,
                efficiency: auto.efficiency,
              });
            }

            // Сортируем по отходам (меньше = лучше)
            allResults.sort((a, b) => a.waste - b.waste);

            // Находим лучший и худший результаты
            const bestAlgo = allResults[0];
            const worstAlgo = allResults[allResults.length - 1];

            // Расчет улучшений
            const wasteImprovement = worstAlgo
              ? (
                  ((worstAlgo.waste - bestAlgo.waste) / worstAlgo.waste) *
                  100
                ).toFixed(1)
              : "0.0";
            const sheetsSaved = worstAlgo
              ? worstAlgo.sheets - bestAlgo.sheets
              : 0;

            // Создаем HTML для таблицы сравнения
            let comparisonHTML =
              '<div style="margin: 20px 0;"><h4 style="margin-bottom: 15px; color: #2c3e50;">📊 Сравнение алгоритмов:</h4>';
            comparisonHTML +=
              '<table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 0.9em;">';
            comparisonHTML +=
              '<thead><tr style="background: #4a6fa5; color: white;">';
            comparisonHTML +=
              '<th style="padding: 10px; text-align: left;">Алгоритм</th>';
            comparisonHTML +=
              '<th style="padding: 10px; text-align: center;">Отходы</th>';
            comparisonHTML +=
              '<th style="padding: 10px; text-align: center;">Листы</th>';
            comparisonHTML +=
              '<th style="padding: 10px; text-align: center;">Время</th>';
            comparisonHTML += "</tr></thead><tbody>";

            allResults.forEach((algo, index) => {
              const isBest = index === 0;
              const isWorst = index === allResults.length - 1;

              let rowStyle = "";
              if (isBest) {
                rowStyle =
                  "background: rgba(144, 238, 144, 0.3); font-weight: bold;";
              } else if (isWorst) {
                rowStyle = "background: rgba(255, 200, 200, 0.3);";
              }

              comparisonHTML += `<tr style="${rowStyle}">`;
              comparisonHTML += `<td style="padding: 8px; border-bottom: 1px solid #ddd;">${algo.name} ${isBest ? "🏆" : ""}</td>`;
              comparisonHTML += `<td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd; 
                                  color: ${algo.waste < 15 ? "#28a745" : algo.waste < 25 ? "#ffc107" : "#dc3545"}">
                                  ${algo.waste.toFixed(2)}%</td>`;
              comparisonHTML += `<td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${algo.sheets}</td>`;
              comparisonHTML += `<td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${algo.time}ms</td>`;
              comparisonHTML += "</tr>";
            });

            comparisonHTML += "</tbody></table></div>";

            algorithmInfo.innerHTML = `
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; margin-bottom: 25px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                  <h3 style="margin: 0; font-size: 1.5em;">🏆 УМНЫЙ ПОИСК: РЕЗУЛЬТАТ</h3>
                  <div style="background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 20px; font-weight: bold;">
                    Выбран: ${auto.name}
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                  <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 10px; text-align: center; backdrop-filter: blur(10px);">
                    <div style="font-size: 0.9em; opacity: 0.9;">ЭКОНОМИЯ ОТХОДОВ</div>
                    <div style="font-size: 1.8em; font-weight: bold; margin-top: 5px; color: #4ade80;">${wasteImprovement}%</div>
                    <div style="font-size: 0.8em; margin-top: 5px;">с ${worstAlgo ? worstAlgo.waste.toFixed(1) : "0"}% до ${bestAlgo.waste.toFixed(1)}%</div>
                  </div>
                  <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 10px; text-align: center; backdrop-filter: blur(10px);">
                    <div style="font-size: 0.9em; opacity: 0.9;">СЭКОНОМЛЕНО ЛИСТОВ</div>
                    <div style="font-size: 1.8em; font-weight: bold; margin-top: 5px; color: #60a5fa;">${sheetsSaved}</div>
                    <div style="font-size: 0.8em; margin-top: 5px;">с ${worstAlgo ? worstAlgo.sheets : "0"} до ${bestAlgo.sheets}</div>
                  </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                  <div style="font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span>📈 АНАЛИЗ РЕЗУЛЬТАТА:</span>
                  </div>
                  <div style="line-height: 1.6;">${auto.reason}</div>
                  <div style="margin-top: 10px; font-size: 0.9em; opacity: 0.9;">
                    • Протестировано алгоритмов: ${auto.testedAlgorithms || allResults.length}<br>
                    • Время оптимизации: ${auto.timeTaken}ms<br>
                    • Деталей в задаче: ${auto.partsCount}
                  </div>
                </div>
              </div>
              
              ${comparisonHTML}
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #4a6fa5; margin-top: 20px;">
                <div style="font-weight: bold; margin-bottom: 10px; color: #2c3e50;">💡 Рекомендация:</div>
                <div style="color: #555;">
                  <strong>Умный поиск протестировал ${auto.testedAlgorithms || allResults.length} алгоритма</strong> и выбрал ${auto.name} как лучший для вашей задачи.
                  Это позволило сэкономить до <strong>${wasteImprovement}% материала</strong> по сравнению с худшим алгоритмом!
                </div>
              </div>
            `;
          } else if (algorithm === "auto" && result.autoSelection) {
            const auto = result.autoSelection;
            const algoMap = {
              greedy: {
                name: "⚡ Быстрый",
                desc: "Мгновенный результат для простых задач",
              },
              genetic: {
                name: "🧬 Генетический",
                desc: "Эволюционный поиск лучшего решения",
              },
              annealing: {
                name: "🔥 Имитация отжига",
                desc: 'Постепенная оптимизация с "охлаждением"',
              },
              parallel: {
                name: "🔄 Параллельный",
                desc: "Тестирование разных стратегий",
              },
            };

            const selectedAlgo = algoMap[auto.algorithm] || algoMap["greedy"];

            algorithmInfo.innerHTML = `
            <h4>📊 Результаты оптимизации</h4>
            <div style="margin-bottom: 15px;">
                <div><strong>Алгоритм:</strong> ${selectedAlgo.name}</div>
                <div><strong>Деталей:</strong> ${parts.length}</div>
                <div><strong>Листов:</strong> ${result.totalSheets}</div>
                <div><strong>Эффективность:</strong> ${result.efficiency}%</div>
                <div><strong>Отходы:</strong> ${result.wastePercentage}%</div>
            </div>
            
            <div class="auto-mode-info">
                <h5>🤖 Интеллектуальный выбор алгоритма</h5>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span class="algorithm-icon">${selectedAlgo.name.split(" ")[0]}</span>
                    <div>
                        <div><strong>Выбран алгоритм:</strong> ${selectedAlgo.name}</div>
                        <div style="font-size: 0.9em; color: #666;">${selectedAlgo.desc}</div>
                    </div>
                </div>
                <div><strong>Причина выбора:</strong> ${auto.reason}</div>
                <div><strong>Время расчета:</strong> ${auto.timeTaken}ms</div>
                <div style="margin-top: 10px; padding: 8px; background: rgba(74, 111, 165, 0.05); border-radius: 6px;">
                    <div style="font-size: 0.9em; color: #666;">
                        <div>📊 <strong>Анализ задачи:</strong></div>
                        <div>• Деталей: ${auto.partsCount}</div>
                        <div>• Оценка сложности: ${auto.complexityScore || "N/A"} баллов</div>
                        <div>• Грубая оценка: ${auto.estimatedSheets || "N/A"} листов</div>
                    </div>
                </div>
            </div>
        `;
          } else {
            const algoMap = {
              greedy: "⚡ Быстрый алгоритм",
              genetic: "🧬 Генетический алгоритм",
              annealing: "🔥 Имитация отжига",
              parallel: "🔄 Параллельная оптимизация",
              smart: "🧠 Умный поиск",
              auto: "🚀 Автоматический выбор",
              bestfit: "🎯 Best Fit алгоритм",
            };

            algoName = algoMap[algorithm] || "⚡ Быстрый алгоритм";
            algoDescription = result.algorithm || algoName;

            algorithmInfo.innerHTML = `
            <h4>📊 Результаты оптимизации</h4>
            <div>
                <div><strong>Алгоритм:</strong> ${algoName}</div>
                <div><strong>Деталей:</strong> ${parts.length}</div>
                <div><strong>Листов:</strong> ${result.totalSheets}</div>
                <div><strong>Эффективность:</strong> ${result.efficiency}%</div>
                <div><strong>Отходы:</strong> ${result.wastePercentage}%</div>
                <div><strong>Площадь отходов:</strong> ${Math.round(result.totalWasteArea)} см²</div>
            </div>
        `;
          }

          algorithmInfo.style.display = "block";
        }

        document.getElementById("loading").style.display = "none";
        document.getElementById("results").style.display = "block";
        document
          .getElementById("results")
          .scrollIntoView({ behavior: "smooth", block: "start" });

        console.log("✅ Оптимизация завершена успешно!");
      } catch (error) {
        console.error("❌ Ошибка при оптимизации:", error);
        updateProgress(0, "Ошибка!");
        alert("Ошибка при оптимизации: " + error.message);
        document.getElementById("loading").style.display = "none";
      }
    }, 100);
  } catch (error) {
    console.error("❌ Ошибка в calculateOptimization:", error);
    alert("Ошибка: " + error.message);
    document.getElementById("loading").style.display = "none";
  }
};

function updateSummary(result) {
  const summaryGrid = document.getElementById("summaryGrid");
  if (!summaryGrid) return;

  const wasteColor =
    parseFloat(result.wastePercentage) < 10
      ? "#52c41a"
      : parseFloat(result.wastePercentage) < 20
        ? "#fa8c16"
        : "#f5222d";
  const efficiencyColor =
    parseFloat(result.efficiency) > 90
      ? "#52c41a"
      : parseFloat(result.efficiency) > 80
        ? "#fa8c16"
        : "#f5222d";

  summaryGrid.innerHTML = `
        <div class="summary-item">
            <div class="summary-value" style="color: #4a6fa5;">${result.totalSheets}</div>
            <div class="summary-label">Всего листов</div>
        </div>
        <div class="summary-item">
            <div class="summary-value" style="color: ${wasteColor};">${result.wastePercentage}%</div>
            <div class="summary-label">Отходы</div>
        </div>
        <div class="summary-item">
            <div class="summary-value" style="color: ${efficiencyColor};">${result.efficiency}%</div>
            <div class="summary-label">Эффективность</div>
        </div>
        <div class="summary-item">
            <div class="summary-value" style="color: #6a5acd;">${Math.round(result.totalWasteArea)}</div>
            <div class="summary-label">Площадь отходов (см²)</div>
        </div>
    `;
}

function displaySheets(sheets, partsCount) {
  const container = document.getElementById("sheetsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (sheets.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #666; padding: 40px;">Нет данных для отображения</p>';
    return;
  }

  // Добавляем легенду цветов
  const legend = window.createColorLegend(partsCount);
  container.appendChild(legend);

  sheets.forEach((sheet, index) => {
    const util = sheet.getUtilization();

    const sheetDiv = document.createElement("div");
    sheetDiv.className = "sheet-visualization";
    sheetDiv.style.animationDelay = `${index * 0.1}s`;

    const infoPanel = document.createElement("div");
    infoPanel.className = "sheet-info-panel";
    infoPanel.innerHTML = `
            <div class="info-item">
                <div class="info-value">${sheet.width} × ${sheet.height} см</div>
                <div class="info-label">Размер листа</div>
            </div>
            <div class="info-item">
                <div class="info-value" style="color: ${parseFloat(util.percentage) > 90 ? "#52c41a" : parseFloat(util.percentage) > 70 ? "#fa8c16" : "#f5222d"}">${util.percentage}%</div>
                <div class="info-label">Заполнение</div>
            </div>
            <div class="info-item">
                <div class="info-value">${sheet.placedRectangles.length}</div>
                <div class="info-label">Деталей</div>
            </div>
            <div class="info-item">
                <div class="info-value" style="color: ${parseFloat(util.wastePercent) < 10 ? "#52c41a" : parseFloat(util.wastePercent) < 30 ? "#fa8c16" : "#f5222d"}">${util.wastePercent}%</div>
                <div class="info-label">Отходы</div>
            </div>
        `;

    const glassContainer = document.createElement("div");
    glassContainer.className = "glass-sheet-container";
    glassContainer.id = `glass-sheet-${index}`;

    sheetDiv.innerHTML = `
            <h3 style="display: flex; align-items: center; gap: 10px; color: #2c3e50;">
                <span style="background: #4a6fa5; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em;">Лист ${index + 1}</span>
                <span style="flex: 1;">Визуализация раскроя</span>
            </h3>
        `;

    sheetDiv.appendChild(infoPanel);
    sheetDiv.appendChild(glassContainer);
    container.appendChild(sheetDiv);

    setTimeout(() => {
      drawGlassSheet(sheet, `glass-sheet-${index}`);
    }, 50);
  });

  // Добавляем инструкции
  addInstructions();
}

function drawGlassSheet(sheet, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const maxWidth = 700;
  const maxHeight = 480;
  const padding = 30;

  const scaleX = (maxWidth - 2 * padding) / sheet.width;
  const scaleY = (maxHeight - 2 * padding) / sheet.height;
  const scale = Math.min(scaleX, scaleY);

  container.innerHTML = "";

  container.style.width = maxWidth + "px";
  container.style.height = maxHeight + "px";

  // Фон листа
  const sheetBg = document.createElement("div");
  sheetBg.style.cssText = `
        position: absolute;
        left: ${padding}px;
        top: ${padding}px;
        width: ${sheet.width * scale}px;
        height: ${sheet.height * scale}px;
        background: 
            repeating-linear-gradient(45deg, 
                rgba(135, 206, 235, 0.2) 0px, 
                rgba(135, 206, 235, 0.2) 20px,
                rgba(173, 216, 230, 0.3) 20px,
                rgba(173, 216, 230, 0.3) 40px
            );
        border: 2px solid #4a6fa5;
        border-radius: 8px;
        box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
    `;
  container.appendChild(sheetBg);

  // Отходы
  sheet.freeSpaces.forEach((space, idx) => {
    const wasteWidth = space.width * scale;
    const wasteHeight = space.height * scale;

    if (wasteWidth > 15 && wasteHeight > 15) {
      const waste = document.createElement("div");
      waste.className = "glass-waste";
      waste.style.cssText = `
                position: absolute;
                left: ${padding + space.x * scale}px;
                top: ${padding + space.y * scale}px;
                width: ${wasteWidth}px;
                height: ${wasteHeight}px;
                background: repeating-linear-gradient(
                    45deg,
                    rgba(220, 53, 69, 0.1),
                    rgba(220, 53, 69, 0.1) 10px,
                    rgba(220, 53, 69, 0.2) 10px,
                    rgba(220, 53, 69, 0.2) 20px
                );
                border: 1px dashed rgba(220, 53, 69, 0.5);
                z-index: 1;
            `;
      container.appendChild(waste);

      // Лейбл для больших отходов
      if (wasteWidth > 60 && wasteHeight > 60) {
        const wasteLabel = document.createElement("div");
        wasteLabel.className = "waste-label";
        wasteLabel.textContent = `${space.width}×${space.height}`;
        wasteLabel.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(220, 53, 69, 0.9);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: bold;
                    border: 1px solid white;
                    white-space: nowrap;
                    z-index: 1002;
                `;
        waste.appendChild(wasteLabel);
      }
    }
  });

  // Детали
  const colors = [
    "#4a6fa5",
    "#6a5acd",
    "#20b2aa",
    "#ff7f50",
    "#9370db",
    "#3cb371",
    "#ff6347",
    "#4682b4",
    "#9acd32",
    "#daa520",
    "#5f9ea0",
    "#d2691e",
  ];

  sheet.placedRectangles.forEach((rect, idx) => {
    const color = colors[idx % colors.length];
    const x = padding + rect.x * scale;
    const y = padding + rect.y * scale;
    const width = rect.width * scale;
    const height = rect.height * scale;

    const piece = document.createElement("div");
    piece.className = "glass-piece";
    piece.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
            background: linear-gradient(135deg, ${color}, ${darkenColor(color, 20)});
            border: 2px solid rgba(0, 0, 0, 0.8);
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
            z-index: 2;
            animation: pieceAppear 0.5s ease-out ${idx * 0.05}s forwards;
            opacity: 0;
        `;

    const pieceId = document.createElement("div");
    pieceId.className = "piece-id";
    pieceId.textContent = rect.id;
    pieceId.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
        `;

    const pieceSize = document.createElement("div");
    pieceSize.className = "piece-size";
    pieceSize.textContent = `${rect.width}×${rect.height} ${rect.rotated ? "↻" : ""}`;
    pieceSize.style.cssText = `
            position: absolute;
            bottom: 5px;
            right: 5px;
            background: rgba(255, 255, 255, 0.9);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            color: #000;
            z-index: 1001;
        `;

    piece.appendChild(pieceId);
    piece.appendChild(pieceSize);
    container.appendChild(piece);

    // Добавляем интерактивность
    piece.addEventListener("mouseenter", () => {
      piece.style.transform = "scale(1.02)";
      piece.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
      piece.style.zIndex = "100";
    });

    piece.addEventListener("mouseleave", () => {
      piece.style.transform = "scale(1)";
      piece.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
      piece.style.zIndex = "2";
    });
  });

  // Размеры листа
  const widthLabel = document.createElement("div");
  widthLabel.className = "sheet-dimensions sheet-width";
  widthLabel.textContent = `${sheet.width} см`;
  widthLabel.style.cssText = `
        position: absolute;
        right: -45px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(44, 62, 80, 0.9);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: bold;
        font-size: 12px;
        z-index: 1003;
        border: 2px solid white;
    `;

  const heightLabel = document.createElement("div");
  heightLabel.className = "sheet-dimensions sheet-height";
  heightLabel.textContent = `${sheet.height} см`;
  heightLabel.style.cssText = `
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(44, 62, 80, 0.9);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: bold;
        font-size: 12px;
        z-index: 1003;
        border: 2px solid white;
    `;

  container.appendChild(widthLabel);
  container.appendChild(heightLabel);
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00ff) - amt;
  const B = (num & 0x0000ff) - amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

function addInstructions() {
  const instructionsContainer = document.getElementById(
    "instructionsContainer",
  );
  if (!instructionsContainer) return;

  instructionsContainer.innerHTML = `
    <h3>📋 Инструкция по использованию результатов</h3>
    <div class="step">
        <div class="step-number">1</div>
        <div class="step-description">
            <strong>Цвета деталей:</strong> Каждая деталь имеет свой цвет и ID (например, <span class="part-badge">D1</span>)
        </div>
    </div>
    <div class="step">
        <div class="step-number">2</div>
        <div class="step-description">
            <strong>Нажмите на деталь в легенде</strong> для её подсветки на всех листах
        </div>
    </div>
    <div class="step">
        <div class="step-number">3</div>
        <div class="step-description">
            <strong>Наведите курсор на деталь</strong> для увеличения и просмотра размеров
        </div>
    </div>
    <div class="step">
        <div class="step-number">4</div>
        <div class="step-description">
            <strong>Символ ↻</strong> означает, что деталь была повёрнута на 90°
        </div>
    </div>
    <div class="step">
        <div class="step-number">5</div>
        <div class="step-description">
            <strong>Заштрихованные области</strong> - отходы материала, которые не могут быть использованы
        </div>
    </div>
  `;
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ DOM загружен, инициализация...");

  setTimeout(() => {
    if (typeof loadExample === "function") {
      loadExample();
      console.log("✅ Сложный пример загружен");
    }
  }, 100);

  // Анимация кнопок
  const buttons = document.querySelectorAll(".btn, .example-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-3px)";
    });

    btn.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // Добавляем CSS анимации
  const style = document.createElement("style");
  style.textContent = `
        @keyframes pieceAppear {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .sheet-visualization {
            animation: slideIn 0.6s ease-out;
        }
        
        .summary-item {
            transition: all 0.3s ease;
        }
        
        .summary-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .glass-piece {
            transition: all 0.3s ease;
        }
    `;
  document.head.appendChild(style);

  console.log("✅ Инициализация завершена");
});

window.Rectangle = Rectangle;
window.Sheet = Sheet;
window.GlassCuttingOptimizer = GlassCuttingOptimizer;

// Добавьте в конец файла
window.testSmartSearchFixed = function () {
  console.clear();

  const sheetWidth = 260;
  const sheetHeight = 180;
  const allowRotation = true;

  // Тестовый набор
  const parts = [
    "250x100",
    "100x250",
    "150x150",
    "200x50",
    "50x200",
    "120x120",
    "180x80",
    "80x180",
  ];

  console.log("🧠 ТЕСТ ИСПРАВЛЕННОГО УМНОГО ПОИСКА");
  console.log("Деталей:", parts.length);

  const optimizer = new GlassCuttingOptimizer(sheetWidth, sheetHeight);

  optimizer.onProgress((percent, message) => {
    console.log(`Прогресс: ${percent}% - ${message}`);
  });

  const start = Date.now();
  const result = optimizer.smartAutoOptimize(parts, allowRotation);
  const time = Date.now() - start;

  console.log("\n🏆 РЕЗУЛЬТАТ:");
  console.log("Листов:", result.totalSheets);
  console.log("Отходы:", result.wastePercentage + "%");
  console.log("Время:", time + "ms");

  if (result.autoSelection) {
    console.log("\n📊 ИНФОРМАЦИЯ О ВЫБОРЕ:");
    console.log("Алгоритм:", result.autoSelection.name);
    console.log("Причина:", result.autoSelection.reason);
    console.log(
      "Протестировано алгоритмов:",
      result.autoSelection.testedAlgorithms,
    );

    if (result.autoSelection.allResults) {
      console.log("\nВсе результаты:");
      result.autoSelection.allResults.forEach((r) => console.log("  " + r));
    }
  }

  console.log("\n✅ Проверка завершена!");
  return result;
};
