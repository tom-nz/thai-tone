import { useState } from 'react';

export default function ToneBoard({
  analysisData,
  pitchData = [],
  initialExpanded = true
}) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div 
      onClick={handleToggleExpand}
      className="w-full max-w-4xl mx-auto my-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 cursor-pointer select-none transition-all duration-200 hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggleExpand();
        }
      }}
      aria-expanded={isExpanded}
      title="คลิกบริเวณใดก็ได้เพื่อย่อ-ขยาย"
    >
      {/* 1. ส่วนหัวข้อ: กำหนดสีม่วงเข้มแน่นอน (#4A148C) ทุกอุปกรณ์ */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
        <h3 
          style={{ color: '#4A148C', fontWeight: 800 }} 
          className="text-base sm:text-lg tracking-tight"
        >
          ไตรยางศ์ หรืออักษร 3 หมู่ และการผันวรรณยุกต์
        </h3>
        <span 
          style={{ color: '#4A148C' }} 
          className="text-xs font-semibold px-2.5 py-1 bg-purple-50 rounded-full"
        >
          {isExpanded ? 'ย่อ ▲' : 'ขยาย ▼'}
        </span>
      </div>

      {/* 2. กล่องวิเคราะห์ภาษา */}
      <div className="mt-3 p-3 bg-purple-50/40 dark:bg-zinc-800/50 rounded-xl border border-purple-100 dark:border-zinc-700/60 text-sm text-gray-700 dark:text-gray-300">
        {analysisData ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span><strong>พยัญชนะต้น:</strong> {analysisData.initial || '-'}</span>
            <span><strong>หมู่สัทอักษร:</strong> {analysisData.class || '-'}</span>
            <span><strong>รูป/เสียงวรรณยุกต์:</strong> {analysisData.tone || '-'}</span>
          </div>
        ) : (
          <p className="text-gray-500 text-xs italic">แสดงผลการวิเคราะห์โครงสร้างพยางค์และวรรณยุกต์</p>
        )}
      </div>

      {/* 3. บรรทัด 5 เส้น (ตัดวงกลมหุ้มคำออก เหลือเฉพาะข้อความและเส้นบรรทัด) */}
      <div 
        className={`mt-4 overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-24 opacity-80'
        }`}
      >
        <svg 
          viewBox="0 0 800 200" 
          className="w-full h-auto drop-shadow-sm"
        >
          {/* เส้นบรรทัด 5 เส้น */}
          {[40, 70, 100, 130, 160].map((yVal, idx) => (
            <line 
              key={`staff-line-${idx}`} 
              x1="30" 
              y1={yVal} 
              x2="770" 
              y2={yVal} 
              stroke="#D1D5DB" 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          ))}

          {/* เรนเดอร์ตัวอักษรบนระดับเสียงโดยไม่มีวงกลมรอบคำ */}
          {pitchData.map((node, i) => {
            const posX = node.x ?? 70 + i * 90;
            const posY = node.y ?? 100;
            return (
              <g key={`pitch-node-${i}`} transform={`translate(${posX}, ${posY})`}>
                {/* เอา <circle> ออกเรียบร้อยแล้ว */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fill="#1E293B"
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: 'system-ui, sans-serif'
                  }}
                >
                  {node.text || node.word || ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}