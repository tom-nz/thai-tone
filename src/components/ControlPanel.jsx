import React, { useState, useEffect } from 'react';
import { playThaiAudio, clearLocalAudioCache } from '../utils/audioService';

export default function ControlPanel(props) {
  // คง props และ logic เดิมไว้ครบถ้วน
  const {
    currentConsonant,
    currentVowel,
    currentTone,
    onPlay,
    onReset,
    ...restProps
  } = props;

  const [activeSubTab, setActiveSubTab] = useState('controls'); // 'controls' | 'audioDb'
  const [audioRecords, setAudioRecords] = useState([]);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newIpa, setNewIpa] = useState('');

  useEffect(() => {
    if (activeSubTab === 'audioDb') {
      fetchAudioList();
    }
  }, [activeSubTab]);

  const fetchAudioList = async () => {
    setLoadingAudio(true);
    try {
      const res = await fetch('/api/tts?list=true');
      if (res.ok) {
        const data = await res.json();
        setAudioRecords(data);
      }
    } catch (e) {
      console.error('Error fetching words list:', e);
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
      alert('เกิดข้อผิดพลาดในการบันทึกคำศัพท์');
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleDelete = async (word) => {
    if (!window.confirm(`คุณต้องการลบไฟล์เสียงของคำว่า "${word}" ใช่หรือไม่?`)) return;
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
    item.word?.includes(searchFilter)
  );

  return (
    <div className="control-panel-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* แท็บสลับหน้าควบคุมเดิม และระบบจัดการฐานข้อมูลเสียง */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveSubTab('controls')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeSubTab === 'controls' ? '#3b82f6' : '#f1f5f9',
            color: activeSubTab === 'controls' ? '#fff' : '#475569',
            fontWeight: 'bold'
          }}
        >
          🎛️ แผงควบคุมหลัก
        </button>
        <button
          onClick={() => setActiveSubTab('audioDb')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeSubTab === 'audioDb' ? '#3b82f6' : '#f1f5f9',
            color: activeSubTab === 'audioDb' ? '#fff' : '#475569',
            fontWeight: 'bold'
          }}
        >
          🗄️ จัดการฐานข้อมูลเสียง (Cloudflare R2/D1)
        </button>
      </div>

      {activeSubTab === 'controls' ? (
        <div className="default-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* UI เดิมสำหรับการกดเล่นและรีเซ็ต */}
          <button
            onClick={() => onPlay ? onPlay() : playThaiAudio(currentConsonant + currentVowel)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔊 ฟังเสียงผันคำ
          </button>
          {onReset && (
            <button
              onClick={onReset}
              style={{
                padding: '10px 16px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🔄 รีเซ็ต
            </button>
          )}
        </div>
      ) : (
        <div className="audio-db-panel" style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>จัดการคลังเสียงและฐานข้อมูลคำศัพท์</h4>
          
          {/* ฟอร์มเพิ่มคำศัพท์ใหม่ / เจนเสียงล่วงหน้า */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="คำศัพท์ (เช่น กา, ป่า, ม้า)"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
            <input
              type="text"
              placeholder="สัทอักษร IPA (ถ้ามี)"
              value={newIpa}
              onChange={(e) => setNewIpa(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
            <button
              onClick={() => handleCreateOrUpdate(newWord, newIpa, true)}
              disabled={loadingAudio || !newWord}
              style={{
                padding: '6px 14px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + สังเคราะห์และบันทึก
            </button>
          </div>

          {/* ค้นหาและรายชื่อคำศัพท์ */}
          <input
            type="text"
            placeholder="🔍 ค้นหาคำในฐานข้อมูล..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '12px' }}
          />

          {loadingAudio ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '12px' }}>กำลังประมวลผลข้อมูล...</div>
          ) : (
            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '8px' }}>คำ</th>
                    <th style={{ padding: '8px' }}>IPA</th>
                    <th style={{ padding: '8px' }}>ไฟล์</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '12px', color: '#94a3b8' }}>
                        ไม่พบข้อมูลคำศัพท์ใน D1/R2
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((row) => (
                      <tr key={row.id || row.word} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{row.word}</td>
                        <td style={{ padding: '8px', color: '#64748b' }}>{row.ipa || '-'}</td>
                        <td style={{ padding: '8px', color: '#64748b' }}>{row.audio_filename}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            onClick={() => playThaiAudio(row.word)}
                            title="ฟังเสียง"
                            style={{ marginRight: '6px', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            🔊
                          </button>
                          <button
                            onClick={() => handleCreateOrUpdate(row.word, row.ipa, true)}
                            title="แปลงเสียงใหม่จาก Azure ทับไฟล์เดิม"
                            style={{ marginRight: '6px', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            🔄
                          </button>
                          <button
                            onClick={() => handleDelete(row.word)}
                            title="ลบคำศัพท์และไฟล์เสียง"
                            style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#ef4444' }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}