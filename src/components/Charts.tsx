import React, { useState } from 'react';
import { MonthlyChartPoint } from '../utils/libraryHelpers';

interface BorrowingChartProps {
  monthlyData: MonthlyChartPoint[];
  dailyData: MonthlyChartPoint[];
  title?: string;
  subtitle?: string;
}

export const BorrowingChart: React.FC<BorrowingChartProps> = ({
  monthlyData,
  dailyData,
  title = 'Statistik Peminjaman & Pengembalian',
  subtitle = 'Perbandingan sirkulasi buku masuk dan keluar',
}) => {
  const [range, setRange] = useState<'monthly' | 'daily'>('monthly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = range === 'monthly' ? monthlyData : dailyData;
  const maxVal = Math.max(
    4,
    ...data.map((d) => Math.max(d.borrowed, d.returned))
  );

  const chartHeight = 200;
  const chartWidth = 620;
  const padLeft = 34;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 32;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  return (
    <div className="bg-white border border-[#E5DDD0] rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E5DDD0]">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#33251B]">{title}</h3>
          <p className="text-xs text-[#5E4B3C] mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="flex items-center gap-4 text-xs text-[#5E4B3C]">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#4A6B53]" aria-hidden="true" />
              Peminjaman
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#33251B]" aria-hidden="true" />
              Pengembalian
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F2ECE3] rounded-lg border border-[#E5DDD0]">
            <button
              type="button"
              onClick={() => setRange('monthly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                range === 'monthly'
                  ? 'bg-white text-[#33251B] shadow-xs'
                  : 'text-[#5E4B3C] hover:text-[#33251B]'
              }`}
            >
              6 Bulan
            </button>
            <button
              type="button"
              onClick={() => setRange('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                range === 'daily'
                  ? 'bg-white text-[#33251B] shadow-xs'
                  : 'text-[#5E4B3C] hover:text-[#33251B]'
              }`}
            >
              7 Hari
            </button>
          </div>
        </div>
      </div>

      <div className="relative pt-5">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-56 overflow-visible"
          role="img"
          aria-label={title}
        >
          {/* Horizontal gridlines */}
          {yTicks.map((tick) => {
            const y = padTop + innerHeight - (tick / maxVal) * innerHeight;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#E5DDD0"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#5E4B3C] text-[10px] font-mono tabular-nums"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Grouped bars */}
          {data.map((point, idx) => {
            const groupWidth = innerWidth / data.length;
            const groupCenter = padLeft + groupWidth * idx + groupWidth / 2;
            const barWidth = Math.min(20, groupWidth * 0.28);
            const gap = 4;

            const borrowedH = Math.max(
              point.borrowed > 0 ? 4 : 0,
              (point.borrowed / maxVal) * innerHeight
            );
            const returnedH = Math.max(
              point.returned > 0 ? 4 : 0,
              (point.returned / maxVal) * innerHeight
            );

            const borrowedY = padTop + innerHeight - borrowedH;
            const returnedY = padTop + innerHeight - returnedH;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={point.monthKey}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <rect
                    x={padLeft + groupWidth * idx + 4}
                    y={padTop}
                    width={groupWidth - 8}
                    height={innerHeight}
                    rx={6}
                    fill="#FAF7F2"
                  />
                )}

                <rect
                  x={groupCenter - barWidth - gap / 2}
                  y={borrowedY}
                  width={barWidth}
                  height={borrowedH}
                  rx={3}
                  fill="#4A6B53"
                  opacity={hoveredIndex === null || isHovered ? 1 : 0.65}
                />

                <rect
                  x={groupCenter + gap / 2}
                  y={returnedY}
                  width={barWidth}
                  height={returnedH}
                  rx={3}
                  fill="#33251B"
                  opacity={hoveredIndex === null || isHovered ? 1 : 0.65}
                />

                <text
                  x={groupCenter}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className={`text-[11px] font-medium ${
                    isHovered ? 'fill-[#33251B]' : 'fill-[#5E4B3C]'
                  }`}
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Accessible hover / active summary strip */}
        <div className="mt-3 pt-3 border-t border-[#E5DDD0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5E4B3C]">
          {hoveredIndex !== null && data[hoveredIndex] ? (
            <div className="flex items-center gap-3 font-medium text-[#33251B]">
              <span>Periode {data[hoveredIndex].label}:</span>
              <span className="font-mono tabular-nums text-[#4A6B53]">
                {data[hoveredIndex].borrowed} Peminjaman
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[#33251B]">
                {data[hoveredIndex].returned} Pengembalian
              </span>
            </div>
          ) : (
            <span>Arahkan kursor ke batang grafik untuk melihat rincian angka per periode.</span>
          )}
          <span className="font-mono tabular-nums">
            Total: {data.reduce((s, d) => s + d.borrowed, 0)} pinjam ·{' '}
            {data.reduce((s, d) => s + d.returned, 0)} kembali
          </span>
        </div>
      </div>
    </div>
  );
};

interface CategoryDistributionProps {
  items: { category: string; count: number }[];
  title?: string;
}

export const CategoryDistributionChart: React.FC<CategoryDistributionProps> = ({
  items,
  title = 'Kategori Terpopuler',
}) => {
  const total = Math.max(
    1,
    items.reduce((sum, item) => sum + item.count, 0)
  );

  return (
    <div className="bg-white border border-[#E5DDD0] rounded-xl p-6 flex flex-col justify-between">
      <div>
        <div className="pb-4 border-b border-[#E5DDD0]">
          <h3 className="font-serif text-lg font-semibold text-[#33251B]">{title}</h3>
          <p className="text-xs text-[#5E4B3C] mt-0.5">
            Distribusi frekuensi peminjaman berdasarkan bidang ilmu
          </p>
        </div>

        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#5E4B3C]">
            Belum ada data kategori peminjaman.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {items.map((item, idx) => {
              const pct = Math.round((item.count / total) * 100);
              const barColor =
                idx === 0
                  ? 'bg-[#4A6B53]'
                  : idx === 1
                  ? 'bg-[#33251B]'
                  : idx === 2
                  ? 'bg-[#7A8F7E]'
                  : 'bg-[#9C8570]';

              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#33251B] truncate pr-3">
                      {item.category}
                    </span>
                    <span className="font-mono tabular-nums text-[#5E4B3C] shrink-0">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#F2ECE3] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[#E5DDD0] flex items-center justify-between text-xs text-[#5E4B3C]">
        <span>Total Sirkulasi Tercatat</span>
        <span className="font-mono font-semibold tabular-nums text-[#33251B]">
          {items.reduce((sum, i) => sum + i.count, 0)} transaksi
        </span>
      </div>
    </div>
  );
};
