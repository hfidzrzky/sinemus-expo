import { useState, useMemo, useCallback } from 'react';

export type SeatMapSeatType = 'standard' | 'vip' | 'aisle';

export interface SeatMapCell {
  rowLabel: string;
  gridColumn: number;
  seatNumber: number;
  seatCode: string;
  gridKey: string;
  type: SeatMapSeatType;
}

export interface UseSeatMapEditorOptions {
  initialRows?: number;
  initialColumns?: number;
  initialDisabledSeats?: string[]; // Kept for backwards compatibility
  initialVipSeats?: string[];
  initialAisleColumns?: number[];
  initialAisleSeats?: string[];
  initialVipPriceSurcharge?: number;
  isLocked?: boolean;
}

export function useSeatMapEditor({
  initialRows = 8,
  initialColumns = 10,
  initialDisabledSeats = [],
  initialVipSeats = [],
  initialAisleColumns = [],
  initialAisleSeats = [],
  initialVipPriceSurcharge = 20000,
  isLocked = false,
}: UseSeatMapEditorOptions = {}) {
  const [rows, setRows] = useState(initialRows);
  const [columns, setColumns] = useState(initialColumns);
  const [vipSeats, setVipSeats] = useState<Set<string>>(() => new Set(initialVipSeats));
  const [vipPriceSurcharge, setVipPriceSurcharge] = useState<number>(initialVipPriceSurcharge);

  // Convert row index (0 -> A, 1 -> B, ...)
  const getRowLetter = useCallback((index: number): string => {
    return String.fromCharCode(65 + index);
  }, []);

  // Single Source of Truth for empty/aisle seats
  // Normalizes initial aisle seats, legacy disabled seats, and initial column aisles
  const [aisleSeats, setAisleSeats] = useState<Set<string>>(() => {
    const initialAisles = new Set<string>([...initialAisleSeats, ...initialDisabledSeats]);
    if (initialAisleColumns && initialAisleColumns.length > 0) {
      for (const col of initialAisleColumns) {
        for (let r = 0; r < initialRows; r++) {
          initialAisles.add(`${String.fromCharCode(65 + r)}${col}`);
        }
      }
    }
    return initialAisles;
  });

  // Check if a full column is currently an aisle
  const isAisleColumn = useCallback(
    (colNumber: number): boolean => {
      if (rows === 0) return false;
      for (let r = 0; r < rows; r++) {
        const seatCode = `${getRowLetter(r)}${colNumber}`;
        if (!aisleSeats.has(seatCode)) {
          return false;
        }
      }
      return true;
    },
    [rows, aisleSeats, getRowLetter]
  );

  // Dynamically derived list of columns that are full aisles
  const aisleColumns = useMemo<number[]>(() => {
    const cols: number[] = [];
    for (let c = 1; c <= columns; c++) {
      if (isAisleColumn(c)) {
        cols.push(c);
      }
    }
    return cols;
  }, [columns, isAisleColumn]);

  // 3-Way Natural Cycle: Reguler (standard) -> VIP -> Gang (aisle) -> Reguler (standard)
  const cycleSeatStatus = useCallback(
    (seatCode: string) => {
      if (isLocked) return;
      const isCurrentlyVip = vipSeats.has(seatCode);
      const isCurrentlyAisle = aisleSeats.has(seatCode);

      if (isCurrentlyVip) {
        // VIP -> Gang (Aisle / Kosong)
        setVipSeats((prev) => {
          const next = new Set(prev);
          next.delete(seatCode);
          return next;
        });
        setAisleSeats((prev) => {
          const next = new Set(prev);
          next.add(seatCode);
          return next;
        });
      } else if (isCurrentlyAisle) {
        // Gang (Aisle / Kosong) -> Reguler (Standard)
        setAisleSeats((prev) => {
          const next = new Set(prev);
          next.delete(seatCode);
          return next;
        });
        setVipSeats((prev) => {
          const next = new Set(prev);
          next.delete(seatCode);
          return next;
        });
      } else {
        // Standard -> VIP
        setVipSeats((prev) => {
          const next = new Set(prev);
          next.add(seatCode);
          return next;
        });
        setAisleSeats((prev) => {
          const next = new Set(prev);
          next.delete(seatCode);
          return next;
        });
      }
    },
    [isLocked, vipSeats, aisleSeats]
  );

  const toggleVipSeat = useCallback(
    (seatCode: string) => {
      if (isLocked) return;
      setVipSeats((prev) => {
        const next = new Set(prev);
        if (next.has(seatCode)) {
          next.delete(seatCode);
        } else {
          next.add(seatCode);
        }
        return next;
      });
      setAisleSeats((prev) => {
        const next = new Set(prev);
        next.delete(seatCode);
        return next;
      });
    },
    [isLocked]
  );

  const toggleAisleColumn = useCallback(
    (colNumber: number) => {
      if (isLocked) return;
      const currentlyFullAisle = isAisleColumn(colNumber);

      setAisleSeats((prev) => {
        const next = new Set(prev);
        for (let r = 0; r < rows; r++) {
          const seatCode = `${getRowLetter(r)}${colNumber}`;
          if (currentlyFullAisle) {
            // Already full aisle -> revert all rows in this column to standard
            next.delete(seatCode);
          } else {
            // Make all rows in this column aisle / empty
            next.add(seatCode);
          }
        }
        return next;
      });

      if (!currentlyFullAisle) {
        setVipSeats((prev) => {
          const next = new Set(prev);
          for (let r = 0; r < rows; r++) {
            next.delete(`${getRowLetter(r)}${colNumber}`);
          }
          return next;
        });
      }
    },
    [isLocked, rows, isAisleColumn, getRowLetter]
  );

  const resetConfig = useCallback((newConfig: UseSeatMapEditorOptions) => {
    const rCount = newConfig.initialRows ?? 6;
    const cCount = newConfig.initialColumns ?? 10;
    setRows(rCount);
    setColumns(cCount);
    setVipSeats(new Set(newConfig.initialVipSeats ?? []));

    const newAisles = new Set<string>([
      ...(newConfig.initialAisleSeats ?? []),
      ...(newConfig.initialDisabledSeats ?? []),
    ]);
    if (newConfig.initialAisleColumns && newConfig.initialAisleColumns.length > 0) {
      for (const col of newConfig.initialAisleColumns) {
        for (let r = 0; r < rCount; r++) {
          newAisles.add(`${String.fromCharCode(65 + r)}${col}`);
        }
      }
    }
    setAisleSeats(newAisles);
    setVipPriceSurcharge(newConfig.initialVipPriceSurcharge ?? 20000);
  }, []);

  // Generate 2D Matrix of seats
  const seatMatrix = useMemo<SeatMapCell[][]>(() => {
    const matrix: SeatMapCell[][] = [];

    for (let r = 0; r < rows; r++) {
      const rowLetter = getRowLetter(r);
      const rowCells: SeatMapCell[] = [];
      let physicalSeatCounter = 0;

      for (let c = 1; c <= columns; c++) {
        const gridKey = `${rowLetter}${c}`;
        let type: SeatMapSeatType = 'standard';

        if (aisleSeats.has(gridKey)) {
          type = 'aisle';
        } else if (vipSeats.has(gridKey)) {
          type = 'vip';
        }

        let seatNumber = 0;
        let seatCode = `${rowLetter}-G${c}`;

        if (type !== 'aisle') {
          physicalSeatCounter++;
          seatNumber = physicalSeatCounter;
          seatCode = `${rowLetter}${seatNumber}`;
        }

        rowCells.push({
          rowLabel: rowLetter,
          gridColumn: c,
          seatNumber,
          seatCode,
          gridKey,
          type,
        });
      }

      matrix.push(rowCells);
    }

    return matrix;
  }, [rows, columns, vipSeats, aisleSeats, getRowLetter]);

  const totalSeats = rows * columns;

  const standardSeatsCount = useMemo(() => {
    return seatMatrix.reduce(
      (acc, row) => acc + row.filter((c) => c.type === 'standard').length,
      0
    );
  }, [seatMatrix]);

  const vipSeatsCount = useMemo(() => {
    return seatMatrix.reduce((acc, row) => acc + row.filter((c) => c.type === 'vip').length, 0);
  }, [seatMatrix]);

  const aisleSeatsCount = useMemo(() => {
    return seatMatrix.reduce((acc, row) => acc + row.filter((c) => c.type === 'aisle').length, 0);
  }, [seatMatrix]);

  const availableSeatsCount = standardSeatsCount + vipSeatsCount;

  const vipSeatsList = useMemo(() => Array.from(vipSeats), [vipSeats]);
  const aisleSeatsList = useMemo(() => Array.from(aisleSeats), [aisleSeats]);

  return {
    rows,
    setRows,
    columns,
    setColumns,
    disabledSeats: [] as string[], // Deprecated/Zeroed for backwards compatibility
    vipSeats: vipSeatsList,
    aisleColumns,
    aisleSeats: aisleSeatsList,
    seatMatrix,
    totalSeats,
    availableSeatsCount,
    standardSeatsCount,
    vipSeatsCount,
    aisleSeatsCount,
    disabledSeatsCount: 0,
    vipPriceSurcharge,
    setVipPriceSurcharge,
    cycleSeatStatus,
    toggleVipSeat,
    toggleAisleColumn,
    isAisleColumn,
    isLocked,
    resetConfig,
  };
}
