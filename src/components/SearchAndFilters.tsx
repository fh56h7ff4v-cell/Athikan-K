import React from 'react';
import { Search, X, SlidersHorizontal, BookOpen, Layers, Video, ArrowUpDown } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedLevel: string;
  setSelectedLevel: (l: string) => void;
  selectedType: string;
  setSelectedType: (t: string) => void;
  sortBy: 'latest' | 'views' | 'favorites';
  setSortBy: (sort: 'latest' | 'views' | 'favorites') => void;
  totalResults: number;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  selectedType,
  setSelectedType,
  sortBy,
  setSortBy,
  totalResults,
}) => {
  const { settings } = useSettings();

  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedCategory !== 'ทั้งหมด' ||
    selectedLevel !== 'ทั้งหมด' ||
    selectedType !== 'ทั้งหมด';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ทั้งหมด');
    setSelectedLevel('ทั้งหมด');
    setSelectedType('ทั้งหมด');
  };

  return (
    <div className="space-y-6">
      {/* Hero Search Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-sky-800 p-6 sm:p-10 text-white shadow-xl">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs sm:text-sm font-medium text-sky-200 border border-white/10">
            <BookOpen className="w-4 h-4 text-sky-300" />
            <span>คลังรวมสื่อการสอน แหล่งความรู้ ใบงาน และคลิปเพื่อการศึกษา</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            ค้นหาความรู้ แบ่งปันสิ่งดีๆ <br />
            <span className="bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent">
              เติบโตไปด้วยกันในทุกระดับชั้น
            </span>
          </h1>

          <p className="text-xs sm:text-base text-blue-100 max-w-xl mx-auto font-light leading-relaxed">
            แหล่งรวมสื่อคุณภาพสำหรับนักเรียน นักศึกษา และคุณครู ค้นพบสื่อใหม่ๆ และแบ่งปันผลงานของคุณได้อย่างอิสระ
          </p>

          {/* Large Search Input */}
          <div className="pt-2">
            <div className="relative max-w-2xl mx-auto">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาตามชื่อเรื่อง วิชา คําอธิบาย หรือแท็กเนื้อหา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 sm:pl-14 pr-12 py-3.5 sm:py-4 rounded-2xl bg-white text-gray-800 placeholder-gray-400 text-sm sm:text-base shadow-2xl focus:outline-hidden focus:ring-4 focus:ring-sky-400/30 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
                  aria-label="ล้างคำค้นหา"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Category Bubbles */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 text-xs">
            <span className="text-blue-200 text-xs hidden sm:inline">หมวดยอดนิยม:</span>
            {settings.categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? 'ทั้งหมด' : cat)}
                className={`px-3 py-1 rounded-full transition text-xs font-medium ${
                  selectedCategory === cat
                    ? 'bg-sky-400 text-blue-950 font-bold shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Filters Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* Category Filter */}
            <div className="relative">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                หมวดหมู่วิชา
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ทั้งหมด">ทุกหมวดหมู่ ({settings.categories.length})</option>
                {settings.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div className="relative">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                ระดับชั้น
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ทั้งหมด">ทุกระดับการศึกษา</option>
                {settings.educationLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Media Type Filter */}
            <div className="relative">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-blue-500" />
                ประเภทสื่อ
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ทั้งหมด">ทุกประเภทสื่อ</option>
                {settings.resourceTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort By & Results Count */}
          <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">เรียงตาม:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden"
              >
                <option value="latest">ล่าสุด</option>
                <option value="views">ยอดเปิดดูสูงสุด</option>
                <option value="favorites">รายการโปรดยอดนิยม</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Tags Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-400 font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> ตัวกรองที่ใช้งาน:
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                ค้นหา: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>
                  <X className="w-3 h-3 hover:text-blue-900" />
                </button>
              </span>
            )}

            {selectedCategory !== 'ทั้งหมด' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                หมวด: {selectedCategory}
                <button onClick={() => setSelectedCategory('ทั้งหมด')}>
                  <X className="w-3 h-3 hover:text-sky-900" />
                </button>
              </span>
            )}

            {selectedLevel !== 'ทั้งหมด' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                ระดับ: {selectedLevel}
                <button onClick={() => setSelectedLevel('ทั้งหมด')}>
                  <X className="w-3 h-3 hover:text-indigo-900" />
                </button>
              </span>
            )}

            {selectedType !== 'ทั้งหมด' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                ประเภท: {selectedType}
                <button onClick={() => setSelectedType('ทั้งหมด')}>
                  <X className="w-3 h-3 hover:text-teal-900" />
                </button>
              </span>
            )}

            <button
              onClick={resetFilters}
              className="text-gray-500 hover:text-rose-600 underline font-medium ml-auto"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            พบสื่อการเรียนรู้ทั้งหมด <strong className="text-blue-600 font-semibold">{totalResults}</strong> รายการ
          </span>
        </div>
      </div>
    </div>
  );
};
