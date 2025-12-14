import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

type CellState = 'hidden' | 'revealed' | 'flagged';
type Cell = {
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
};

type Difficulty = {
  rows: number;
  cols: number;
  mines: number;
};

const DIFFICULTIES: Record<string, Difficulty> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

const Index = () => {
  const [difficulty, setDifficulty] = useState<string>('easy');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const currentDiff = DIFFICULTIES[difficulty];

  const initializeGrid = useCallback(() => {
    const { rows, cols, mines } = currentDiff;
    const newGrid: Cell[][] = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({
            isMine: false,
            state: 'hidden' as CellState,
            adjacentMines: 0,
          }))
      );

    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      if (!newGrid[row][col].isMine) {
        newGrid[row][col].isMine = true;
        minesPlaced++;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].adjacentMines = count;
        }
      }
    }

    setGrid(newGrid);
    setGameStatus('playing');
    setFlagCount(0);
    setTime(0);
    setTimerActive(false);
  }, [currentDiff]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && gameStatus === 'playing') {
      interval = setInterval(() => {
        setTime((t) => Math.min(t + 1, 999));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameStatus]);

  const revealCell = useCallback(
    (row: number, col: number) => {
      if (gameStatus !== 'playing') return;
      if (!timerActive) setTimerActive(true);

      const cell = grid[row][col];
      if (cell.state !== 'hidden') return;

      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
      
      const reveal = (r: number, c: number) => {
        if (r < 0 || r >= currentDiff.rows || c < 0 || c >= currentDiff.cols) return;
        const cell = newGrid[r][c];
        if (cell.state !== 'hidden') return;
        
        cell.state = 'revealed';
        
        if (cell.isMine) {
          setGameStatus('lost');
          setTimerActive(false);
          newGrid.forEach((row) => row.forEach((cell) => {
            if (cell.isMine) cell.state = 'revealed';
          }));
          return;
        }
        
        if (cell.adjacentMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              reveal(r + dr, c + dc);
            }
          }
        }
      };

      reveal(row, col);
      setGrid(newGrid);

      const hiddenNonMines = newGrid.flat().filter((c) => !c.isMine && c.state === 'hidden').length;
      if (hiddenNonMines === 0) {
        setGameStatus('won');
        setTimerActive(false);
      }
    },
    [grid, gameStatus, timerActive, currentDiff]
  );

  const toggleFlag = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      e.preventDefault();
      if (gameStatus !== 'playing') return;
      if (!timerActive) setTimerActive(true);

      const cell = grid[row][col];
      if (cell.state === 'revealed') return;

      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
      if (cell.state === 'hidden') {
        newGrid[row][col].state = 'flagged';
        setFlagCount(flagCount + 1);
      } else {
        newGrid[row][col].state = 'hidden';
        setFlagCount(flagCount - 1);
      }
      setGrid(newGrid);
    },
    [grid, gameStatus, timerActive, flagCount]
  );

  const getCellContent = (cell: Cell) => {
    if (cell.state === 'flagged') return '🚩';
    if (cell.state === 'hidden') return '';
    if (cell.isMine) return '💣';
    if (cell.adjacentMines === 0) return '';
    return cell.adjacentMines;
  };

  const getCellColor = (num: number) => {
    const colors = ['', '#0000FF', '#008000', '#FF0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
    return colors[num] || '#000000';
  };

  return (
    <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4">
      <div className="flex flex-col gap-4 items-center">
        <Card className="p-6 bg-[#C0C0C0] border-4 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-none rounded-none">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 p-2 bg-[#C0C0C0] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
              <div className="flex items-center gap-4">
                <div className="bg-black text-[#FF0000] font-mono text-2xl px-3 py-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white min-w-[80px] text-center">
                  {String(currentDiff.mines - flagCount).padStart(3, '0')}
                </div>
              </div>

              <Button
                onClick={initializeGrid}
                className="w-12 h-12 text-3xl p-0 bg-[#C0C0C0] hover:bg-[#C0C0C0] border-4 border-t-white border-l-white border-r-[#808080] border-b-[#808080] rounded-none shadow-none"
              >
                {gameStatus === 'lost' ? '😵' : gameStatus === 'won' ? '😎' : '🙂'}
              </Button>

              <div className="bg-black text-[#FF0000] font-mono text-2xl px-3 py-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white min-w-[80px] text-center">
                {String(time).padStart(3, '0')}
              </div>
            </div>

            <div className="p-2 bg-[#C0C0C0] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
              <div
                className="grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${currentDiff.cols}, 1fr)`,
                }}
              >
                {grid.map((row, rowIdx) =>
                  row.map((cell, colIdx) => (
                    <button
                      key={`${rowIdx}-${colIdx}`}
                      onClick={() => revealCell(rowIdx, colIdx)}
                      onContextMenu={(e) => toggleFlag(rowIdx, colIdx, e)}
                      className={`
                        w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-xs sm:text-sm md:text-base font-bold
                        ${
                          cell.state === 'revealed'
                            ? 'bg-[#C0C0C0] border border-[#808080]'
                            : 'bg-[#C0C0C0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080]'
                        }
                        ${cell.state === 'hidden' || cell.state === 'flagged' ? 'active:border-[#808080]' : ''}
                        flex items-center justify-center
                      `}
                      style={{
                        color: cell.state === 'revealed' && !cell.isMine ? getCellColor(cell.adjacentMines) : '#000',
                      }}
                      disabled={gameStatus !== 'playing'}
                    >
                      {getCellContent(cell)}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-[#C0C0C0] border-4 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-none rounded-none">
          <div className="flex items-center gap-4">
            <label className="font-bold text-sm">Сложность:</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-[180px] bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white rounded-none shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#C0C0C0] border-2 border-black rounded-none">
                <SelectItem value="easy" className="hover:bg-[#000080] hover:text-white">
                  Легко (9×9, 10 мин)
                </SelectItem>
                <SelectItem value="medium" className="hover:bg-[#000080] hover:text-white">
                  Средне (16×16, 40 мин)
                </SelectItem>
                <SelectItem value="hard" className="hover:bg-[#000080] hover:text-white">
                  Сложно (16×30, 99 мин)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {gameStatus !== 'playing' && (
          <Card className="p-4 bg-[#C0C0C0] border-4 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-none rounded-none">
            <div className="text-center font-bold text-lg">
              {gameStatus === 'won' ? '🎉 Победа!' : '💥 Игра окончена!'}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
