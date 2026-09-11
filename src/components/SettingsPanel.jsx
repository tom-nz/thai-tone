import React, { useState, useEffect } from 'react';
import { playThaiAudio, clearLocalAudioCache } from '../utils/audioService';

export default function SettingsPanel(props) {
  // รับ props เดิมทั้งหมดเพื่อไม่ให้ Logic เดิมเสียหาย
  const {
    showPattara,
    onToggleSound,
    selectedVoice,
    onVoiceChange,
    speechRate,
    onRateChange,
    onTestVoice,
    onBgColorChange,
    ...restProps
  } = props;

  const [activePanelTab, setActivePanelTab] = useState('settings'); // 'settings' | 'audioDb'
  const [audioRecords, setAudioRecords] = useState([]);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newIpa, setNewIpa] = useState('');

  useEffect(() => {
    if (activePanelTab === 'audioDb') {
      fetchAudioList();
    }
  }, [activePanelTab]);

  const fetchAudioList = async () => {
    setLoadingAudio(true);
    try {
      const res = await fetch('/api/tts?list=true');
      if (res.ok) {
        const data = await res.json();
        setAudioRecords(data);
      }
    } catch (e) {
      console.error('Error fetching audio list:', e);
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleCreateOrUpdate = async (word, ipa, overwrite = false) => {
    if (!word) return;
    setLoadingAudio(true);
    try {
      await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, ipa, overwrite }),
      });
      await clearLocalAudioCache(word);
      setNewWord('');
      setNewIpa('');
      await fetchAudioList();
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการบันทึกคำ');
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleDelete = async (word) => {
    if (!window.confirm(`ยืนยันลบไฟล์เสียงของคำว่า "${word}" หรือไม่?`)) return;
    setLoadingAudio(true);
    try {
      await fetch('/api/tts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      await clearLocalAudioCache(word);
      await fetchAudioList();
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการลบ');
    } finally {
      setLoadingAudio(false);
    }
  };

  const filteredRecords = audioRecords.filter(item => 
    item.word?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* แท็บสลับหน้าตั้งค่าเดิม กับหน้าจัดการเสียง D1/R2 */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
        <button
          type="button"
          onClick={() => setActivePanelTab('settings')}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: '13px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activePanelTab === 'settings' ? '#2563eb' : '#f1f5f9',
            color: activePanelTab === 'settings' ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          ⚙️ การตั้งค่าเสียง
        </button>
        <button
          type="button"
          onClick={() => setActivePanelTab('audioDb')}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: '13px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activePanelTab === 'audioDb' ? '#2563eb' : '#f1f5f9',
            color: activePanelTab === 'audioDb' ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          🗄️ ฐานข้อมูลเสียง (R2/D1)
        </button>
      </div>

      {activePanelTab === 'settings' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* UI เดิมทั้งหมด */}
          <div>
            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showPattara} 
                onChange={onToggleSound} 
              />
              เปิดเสียงเมื่อคลิกบรรทัด
            </label>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>เสียงอ่าน</div>
            <select 
              value={selectedVoice} 
              onChange={onVoiceChange}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="Microsoft Pattara - Thai (Thailand) (th-TH)">Microsoft Pattara - Thai (Thailand) (th-TH)</option>
              <option value="th-TH-PremwadeeNeural">Premwadee (Azure Neural TTS)</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
              <span>ความเร็วการอ่าน:</span>
              <span>{speechRate}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="1.5" 
              step="0.05" 
              value={speechRate} 
              onChange={onRateChange}
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="button"
            onClick={onTestVoice}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            ▶ ทดลองอ่านคำ
          </button>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>🎨 สีพื้นหลังกระดาษบรรทัด 5 เส้น</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['ขาว', 'ครีม', 'ฟ้าอ่อน', 'เขียวอ่อน', 'เทาอ่อน'].map((colorName) => (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => onBgColorChange && onBgColorChange(colorName)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  {colorName}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* แผงจัดการฐานข้อมูลเสียง R2/D1 เพิ่มเติม */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
            คลังเสียง Cloudflare R2 & D1
          </div>

          {/* ช่องเพิ่ม/ทดสอบคำศัพท์ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              type="text"
              placeholder="พิมพ์คำศัพท์ (เช่น กา, ข่า, ค้า)"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
            <input
              type="text"
              placeholder="สัทอักษร IPA (ถ้าต้องการกำกับวรรณยุกต์)"
              value={newIpa}
              onChange={(e) => setNewIpa(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
            <button
              type="button"
              onClick={() => handleCreateOrUpdate(newWord, newIpa, true)}
              disabled={loadingAudio || !newWord.trim()}
              style={{
                padding: '6px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              {loadingAudio ? 'กำลังประมวลผล...' : '+ สังเคราะห์เสียงและบันทึก'}
            </button>
          </div>

          {/* ช่องค้นหา */}
          <input
            type="text"
            placeholder="🔍 ค้นหาคำที่บันทึกแล้ว..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
          />

          {/* รายการคำศัพท์ */}
          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            {loadingAudio ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>กำลังโหลด...</div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>ไม่มีคำศัพท์ในระบบ</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <tbody>
                  {filteredRecords.map((item) => (
                    <tr key={item.id || item.word} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{item.word}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => playThaiAudio(item.word)}
                          title="ฟังเสียง"
                          style={{ cursor: 'pointer', border: 'none', background: 'none', marginRight: '6px' }}
                        >
                          🔊
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateOrUpdate(item.word, item.ipa, true)}
                          title="แปลงใหม่ทับไฟล์เดิม"
                          style={{ cursor: 'pointer', border: 'none', background: 'none', marginRight: '6px' }}
                        >
                          🔄
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.word)}
                          title="ลบ"
                          style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#ef4444' }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}