import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Upload, Sparkles, AlertCircle, Play, Eye, Image as ImageIcon } from 'lucide-react';
import { RepeatType, DelayType } from '../types';

interface ScheduleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleGeneratorModal: React.FC<ScheduleGeneratorModalProps> = ({ isOpen, onClose }) => {
  const { templates, generateSchedulesFromList, showToast, schedules } = useApp();

  const [customersText, setCustomersText] = useState(
    "Budi Utomo,08123456789\nAndi Wijaya,082112345678\nRina Lestari,085712345678\nSiska Amelia,089876543210"
  );
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [repeat, setRepeat] = useState<RepeatType>('Tidak');
  const [interval, setInterval] = useState('3-5 menit');
  const [randomInterval, setRandomInterval] = useState(true);
  const [delay, setDelay] = useState<DelayType>('30-60 detik');
  const [imageUrl, setImageUrl] = useState('');
  const [generateFollowUp, setGenerateFollowUp] = useState(false);
  const [stopIfReplied, setStopIfReplied] = useState(true);
  
  // Preview timeline
  const [previewList, setPreviewList] = useState<{ time: string; date: string; name: string; type: string }[]>([]);

  useEffect(() => {
    if (templates.length > 0 && !templateId) {
      setTemplateId(templates[0].id);
    }
  }, [templates]);

  // Calculate dynamic preview timeline
  useEffect(() => {
    const lines = customersText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0 || !startTime || !startDate) {
      setPreviewList([]);
      return;
    }

    // Minutes value for interval
    let minsValue = 3;
    if (interval === '2-3 menit') minsValue = 2.5;
    else if (interval === '3-5 menit') minsValue = 4;
    else if (interval === '5-8 menit') minsValue = 6.5;
    else if (interval === '10-15 menit') minsValue = 12.5;

    const [startHour, startMin] = startTime.split(':').map((v) => parseInt(v, 10));
    let currentHour = startHour;
    let currentMin = startMin;

    const tempPreview: { time: string; date: string; name: string; type: string }[] = [];

    // Count starting index of CST placeholder names in existing schedules
    let maxCstNum = 0;
    schedules.forEach((s) => {
      const match = s.customerName.match(/^CST(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxCstNum) maxCstNum = num;
      }
    });

    lines.forEach((line, index) => {
      let name = '';
      let phone = '';

      if (line.includes(',')) {
        const parts = line.split(',');
        const p0 = parts[0].trim();
        const p1 = parts[1].trim();
        
        // check which is phone and which is name
        const p0IsPhone = /^\+?\d{5,15}$/.test(p0.replace(/[\s\-()]/g, ''));
        const p1IsPhone = /^\+?\d{5,15}$/.test(p1.replace(/[\s\-()]/g, ''));

        if (p0IsPhone && !p1IsPhone) {
          phone = p0;
          name = p1;
        } else if (p1IsPhone && !p0IsPhone) {
          phone = p1;
          name = p0;
        } else {
          name = p0;
          phone = p1;
        }
      } else {
        const lineIsPhone = /^\+?\d{5,15}$/.test(line.replace(/[\s\-()]/g, ''));
        if (lineIsPhone) {
          phone = line;
          name = '';
        } else {
          name = line;
          phone = '';
        }
      }

      if (!name) {
        maxCstNum++;
        name = `CST${String(maxCstNum).padStart(3, '0')}`;
      }

      if (index > 0) {
        currentMin += Math.round(minsValue);
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
        currentHour = currentHour % 24;
      }

      const formattedHour = String(currentHour).padStart(2, '0');
      const formattedMin = String(currentMin).padStart(2, '0');
      const calculatedTime = `${formattedHour}:${formattedMin}`;

      tempPreview.push({
        time: calculatedTime,
        date: startDate,
        name,
        type: 'Base Message',
      });

      if (generateFollowUp) {
        const addDays = (dateStr: string, days: number): string => {
          const d = new Date(dateStr);
          d.setDate(d.getDate() + days);
          return d.toISOString().split('T')[0];
        };

        const days = [1, 2, 4, 7];
        days.forEach((dayNum) => {
          tempPreview.push({
            time: calculatedTime,
            date: addDays(startDate, dayNum),
            name,
            type: `Follow-Up H+${dayNum}`,
          });
        });
      }
    });

    // Sort by date then by time
    tempPreview.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    setPreviewList(tempPreview.slice(0, 15)); // show max 15 preview records
  }, [customersText, startTime, startDate, interval, generateFollowUp, schedules]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // @ts-ignore
      import('xlsx').then(({ read, utils }) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = utils.sheet_to_json<any[]>(worksheet, { header: 1 });

            if (rows.length === 0) {
              showToast('File excel kosong!', 'warning');
              return;
            }

            // Identify columns
            const firstRow = rows[0].map(cell => String(cell || '').trim().toLowerCase());
            let nameColIndex = -1;
            let phoneColIndex = -1;

            for (let i = 0; i < firstRow.length; i++) {
              const cellVal = firstRow[i];
              if (cellVal.includes('nama') || cellVal.includes('name') || cellVal.includes('customer')) {
                nameColIndex = i;
              } else if (cellVal.includes('nomor') || cellVal.includes('number') || cellVal.includes('phone') || cellVal.includes('telp') || cellVal.includes('wa') || cellVal.includes('hp')) {
                phoneColIndex = i;
              }
            }

            const dataRows = (nameColIndex !== -1 || phoneColIndex !== -1) ? rows.slice(1) : rows;

            const parsedLines: string[] = [];
            dataRows.forEach((row) => {
              if (!row || row.length === 0) return;
              let name = '';
              let phone = '';

              if (phoneColIndex !== -1) {
                phone = String(row[phoneColIndex] || '').trim();
                if (nameColIndex !== -1) {
                  name = String(row[nameColIndex] || '').trim();
                }
              } else {
                let foundPhone = '';
                let foundName = '';
                row.forEach((cell) => {
                  const cellStr = String(cell || '').trim();
                  if (!cellStr) return;
                  const digits = cellStr.replace(/\D/g, '');
                  if (/^\d{5,15}$/.test(digits) && !foundPhone) {
                    foundPhone = cellStr;
                  } else if (!foundName) {
                    foundName = cellStr;
                  }
                });
                phone = foundPhone;
                name = foundName;
              }

              if (phone) {
                if (name) {
                  parsedLines.push(`${name},${phone}`);
                } else {
                  parsedLines.push(phone);
                }
              }
            });

            if (parsedLines.length > 0) {
              setCustomersText(parsedLines.join('\n'));
              showToast(`Berhasil mengimpor ${parsedLines.length} customer dari Excel!`, 'success');
            } else {
              showToast('Tidak ada nomor telepon yang valid terdeteksi!', 'warning');
            }
          } catch (err) {
            console.error(err);
            showToast('Gagal memproses file Excel.', 'warning');
          }
        };
        reader.readAsArrayBuffer(file);
      }).catch((err) => {
        console.error(err);
        showToast('Gagal memuat parser Excel.', 'warning');
      });
    } else {
      // CSV or plain text
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const parsedLines: string[] = [];

          rawLines.forEach((line) => {
            const lowercaseLine = line.toLowerCase();
            if (lowercaseLine.includes('nama,') || lowercaseLine.includes('name,') || lowercaseLine.includes('nomor,') || lowercaseLine.includes('phone,')) {
              return; // skip header
            }

            let parts = line.split(/[,;\t]/).map(p => p.trim());
            if (parts.length === 1) {
              parsedLines.push(parts[0]);
            } else {
              let phoneIdx = parts.findIndex(p => {
                const cleaned = p.replace(/[\s+\-()]/g, '');
                return /^\d{5,15}$/.test(cleaned);
              });

              if (phoneIdx !== -1) {
                const phone = parts[phoneIdx];
                const nameIdx = phoneIdx === 0 ? 1 : 0;
                const name = parts[nameIdx] || '';
                if (name) {
                  parsedLines.push(`${name},${phone}`);
                } else {
                  parsedLines.push(phone);
                }
              } else {
                parsedLines.push(line);
              }
            }
          });

          if (parsedLines.length > 0) {
            setCustomersText(parsedLines.join('\n'));
            showToast(`Berhasil mengimpor ${parsedLines.length} customer dari CSV!`, 'success');
          } else {
            showToast('Format CSV tidak dikenali!', 'warning');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGenerate = () => {
    if (!customersText.trim()) {
      showToast('Harap masukkan daftar customer terlebih dahulu!', 'warning');
      return;
    }

    generateSchedulesFromList({
      customersText,
      templateId,
      startDate,
      startTime,
      repeat,
      interval,
      randomInterval,
      delay,
      imageUrl,
      generateFollowUp,
      stopIfReplied,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/45 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
              ✨ Schedule Generator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer p-0.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Split Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel: Settings */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-zinc-800">
            {/* Input list */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                  Daftar Customer (Format: Nama,Nomor atau Hanya Nomor)
                </label>
                <label className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer">
                  <Upload className="h-3 w-3" />
                  Upload CSV / Excel
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                rows={5}
                required
                placeholder="Contoh:&#10;Budi,08123456789&#10;082112345678 (Nama opsional)&#10;Andi Wijaya,085712345678"
                value={customersText}
                onChange={(e) => setCustomersText(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[9px] text-gray-400 dark:text-zinc-500 block mt-0.5">
                Pastikan formatnya dipisahkan koma per baris.
              </span>
            </div>

            {/* Template selector */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Template Utama
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Interval & Random Interval */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Interval Pengiriman
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="2-3 menit">2-3 menit</option>
                  <option value="3-5 menit">3-5 menit</option>
                  <option value="5-8 menit">5-8 menit</option>
                  <option value="10-15 menit">10-15 menit</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Random Interval Delay
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    id="randomIntervalCheck"
                    type="checkbox"
                    checked={randomInterval}
                    onChange={(e) => setRandomInterval(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="randomIntervalCheck" className="text-[11px] text-gray-600 dark:text-zinc-400 select-none cursor-pointer">
                    Jitter acak (ON)
                  </label>
                </div>
              </div>
            </div>

            {/* Delay & Repeat row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Delay Pengiriman (WA)
                </label>
                <select
                  value={delay}
                  onChange={(e) => setDelay(e.target.value as DelayType)}
                  className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="30-60 detik">30-60 detik</option>
                  <option value="60-120 detik">60-120 detik</option>
                  <option value="2-5 menit">2-5 menit</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Repeat (Pengulangan)
                </label>
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as RepeatType)}
                  className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="Tidak">Tidak</option>
                  <option value="Harian">Harian</option>
                  <option value="Mingguan">Mingguan</option>
                  <option value="Bulanan">Bulanan</option>
                </select>
              </div>
            </div>

            {/* Image URL input & Upload */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Image (Opsional)
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImageUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="image-upload-gen"
                />
                <label
                  htmlFor="image-upload-gen"
                  className="px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700"
                >
                  Upload
                </label>
                <input
                  type="url"
                  placeholder="Atau URL gambar..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              {imageUrl && (
                <img src={imageUrl} alt="preview" className="mt-2 h-20 w-full object-contain rounded border border-gray-200 dark:border-zinc-700" />
              )}
            </div>

            {/* Generate follow up checkbox */}
            <div className="p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2.5">
              <input
                id="genFollowUp"
                type="checkbox"
                checked={generateFollowUp}
                onChange={(e) => setGenerateFollowUp(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor="genFollowUp"
                  className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-400 select-none cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  Generate Follow Up (H+1, H+2, H+4, H+7)
                </label>
                <p className="text-[9px] text-emerald-700/80 dark:text-emerald-500/70 mt-0.5 leading-relaxed">
                  Secara cerdas membuat 4 rangkaian follow up lanjutan terjadwal berdasarkan template follow up masing-masing.
                </p>
              </div>
            </div>

            {/* Stop schedule on response checkbox */}
            <div className="p-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50/20 dark:bg-red-950/10 flex items-start gap-2.5">
              <input
                id="stopIfRepliedCheckbox"
                type="checkbox"
                checked={stopIfReplied}
                onChange={(e) => setStopIfReplied(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor="stopIfRepliedCheckbox"
                  className="block text-[11px] font-bold text-red-800 dark:text-red-400 select-none cursor-pointer flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  Matikan Schedule Jika Merespon
                </label>
                <p className="text-[9px] text-red-700/80 dark:text-red-500/70 mt-0.5 leading-relaxed">
                  Jika pesan sudah direspon/dibalas oleh customer, seluruh sisa jadwal follow-up untuk nomor tersebut akan otomatis dimatikan (paused) agar tidak mengganggu.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Timeline Preview */}
          <div className="w-full md:w-[350px] bg-gray-50/50 dark:bg-zinc-900/40 p-4 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-gray-150 dark:border-zinc-800">
              <Eye className="h-3.5 w-3.5 text-gray-400" />
              <h4 className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                Live Timeline Preview (Max 15)
              </h4>
            </div>

            {/* Timeline content list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {previewList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="h-8 w-8 text-gray-300 dark:text-zinc-700 mb-1.5" />
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                    Masukkan daftar customer di sebelah kiri untuk melihat visualisasi timeline pengiriman.
                  </p>
                </div>
              ) : (
                previewList.map((item, index) => (
                  <div
                    key={index}
                    className="p-2 rounded border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start justify-between shadow-xs relative overflow-hidden"
                  >
                    {/* Left category indicator */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1 ${item.type.includes('Follow-Up') ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                    
                    <div className="pl-2 space-y-0.5">
                      <p className="text-[11px] font-semibold text-gray-800 dark:text-zinc-200">
                        {item.name}
                      </p>
                      <p className="text-[9px] text-gray-400 dark:text-zinc-500">
                        Date: <span className="font-mono text-gray-500 dark:text-zinc-400">{item.date}</span>
                      </p>
                      <span className="inline-block text-[9px] font-medium text-emerald-600 dark:text-emerald-400/80 mt-0.5">
                        {item.type}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded shrink-0">
                      ⏰ {item.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-2 bg-gray-50/50 dark:bg-zinc-900/30">
          <button
            onClick={onClose}
            className="py-1 px-3 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleGenerate}
            disabled={previewList.length === 0}
            className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-all"
          >
            <Play className="h-3 w-3 fill-current" />
            Generate {previewList.length} Schedules
          </button>
        </div>
      </div>
    </div>
  );
};
