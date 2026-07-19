import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar, Clock, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { RepeatType, DelayType, Schedule } from '../types';

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSchedule?: Schedule | null;
}

export const NewScheduleModal: React.FC<NewScheduleModalProps> = ({ isOpen, onClose, editingSchedule }) => {
  const { templates, currentUser, addSchedule, updateSchedule, showToast, schedules } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [repeat, setRepeat] = useState<RepeatType>('Tidak');
  const [delay, setDelay] = useState<DelayType>('30-60 detik');
  const [generateFollowUp, setGenerateFollowUp] = useState(false);
  const [stopIfReplied, setStopIfReplied] = useState(true);

  // Load editing schedule data if provided
  useEffect(() => {
    if (editingSchedule) {
      setCustomerName(editingSchedule.customerName);
      setWhatsappNumber(editingSchedule.whatsappNumber);
      setMessage(editingSchedule.message);
      setImageUrl(editingSchedule.imageUrl || '');
      setTemplateId(editingSchedule.templateId || '');
      setDate(editingSchedule.date);
      setTime(editingSchedule.time);
      setRepeat(editingSchedule.repeat);
      setDelay(editingSchedule.delay);
      setGenerateFollowUp(false); // disable during edit
      setStopIfReplied(editingSchedule.stopIfReplied ?? true);
    } else {
      // resets
      setCustomerName('');
      setWhatsappNumber('');
      setMessage('');
      setImageUrl('');
      setTemplateId('');
      setDate(new Date().toISOString().split('T')[0]);
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      setRepeat('Tidak');
      setDelay('30-60 detik');
      setGenerateFollowUp(false);
      setStopIfReplied(true);
    }
  }, [editingSchedule, isOpen]);

  // Handle template selection and dynamic variable replacement
  useEffect(() => {
    if (!templateId || editingSchedule) return;

    const selected = templates.find((t) => t.id === templateId);
    if (selected) {
      const salesName = currentUser?.name || 'Egi';
      const isPlaceholder = !customerName || /^CST\d+$/i.test(customerName.trim());
      const replacementName = isPlaceholder ? '' : customerName;
      let compiled = selected.content
        .replace(/{{nama}}/g, replacementName)
        .replace(/{{sales}}/g, salesName)
        .replace(/{{tanggal}}/g, date);
      
      if (isPlaceholder) {
        compiled = compiled
          .replace(/\s+,\s*/g, ', ')
          .replace(/\s+\.\s*/g, '. ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      setMessage(compiled);
    }
  }, [templateId, customerName, date, templates, currentUser]);

  if (!isOpen) return null;

  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber || !message) {
      showToast('Harap lengkapi nomor WhatsApp dan pesan!', 'warning');
      return;
    }

    const salesName = currentUser?.name || 'Egi';
    const salesId = currentUser?.id || 'u2';

    let finalCustomerName = customerName.trim();
    if (!finalCustomerName) {
      let maxNum = 0;
      schedules.forEach((s) => {
        const match = s.customerName.match(/^CST(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextNum = maxNum + 1;
      finalCustomerName = `CST${String(nextNum).padStart(3, '0')}`;
    }

    const isPlaceholder = /^CST\d+$/i.test(finalCustomerName);
    const compileWithFinalName = (content: string, dateStr: string) => {
      const replacementName = isPlaceholder ? '' : finalCustomerName;
      let compiled = content
        .replace(/{{nama}}/g, replacementName)
        .replace(/{{sales}}/g, salesName)
        .replace(/{{tanggal}}/g, dateStr);
      if (isPlaceholder) {
        compiled = compiled
          .replace(/\s+,\s*/g, ', ')
          .replace(/\s+\.\s*/g, '. ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      return compiled;
    };

    if (editingSchedule) {
      const updated: Schedule = {
        ...editingSchedule,
        customerName: finalCustomerName,
        whatsappNumber,
        message,
        imageUrl: imageUrl || undefined,
        templateId: templateId || undefined,
        date,
        time,
        repeat,
        delay,
        stopIfReplied,
      };
      updateSchedule(updated);
    } else {
      // Base schedule creation
      addSchedule({
        time,
        date,
        customerName: finalCustomerName,
        whatsappNumber,
        salesName,
        salesId,
        status: 'Pending',
        message,
        imageUrl: imageUrl || undefined,
        templateId: templateId || undefined,
        repeat,
        delay,
        stopIfReplied,
      });

      // Generate Follow-up schedules if checked
      if (generateFollowUp) {
        const followUpDays = [1, 2, 4, 7];
        followUpDays.forEach((days) => {
          // Find matching H+ template or fallback to current message or template
          const fuTemplate = templates.find((t) => t.name.toLowerCase().includes(`h+${days}`)) || 
                             templates.find((t) => t.id === templateId) || 
                             { content: message, id: undefined };
          
          const fuDate = addDays(date, days);
          const fuMsg = compileWithFinalName(fuTemplate.content, fuDate);

          addSchedule({
            time, // Scheduled at the same time
            date: fuDate,
            customerName: finalCustomerName,
            whatsappNumber,
            salesName,
            salesId,
            status: 'Pending',
            message: fuMsg,
            templateId: fuTemplate.id,
            repeat: 'Tidak',
            delay,
            followUpDay: days,
            stopIfReplied,
          });
        });
        showToast(`Berhasil menjadwalkan 4 follow up otomatis (H+1, H+2, H+4, H+7)!`, 'success');
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/45 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
          <h3 className="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-wider">
            {editingSchedule ? '✏️ Edit Follow Up' : '➕ New Follow Up'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer p-0.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto max-h-[80vh]">
          {/* Main info row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Nama Customer (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Nomor WhatsApp *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 08123456789"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Template select */}
          {!editingSchedule && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Pilih Template Pesan
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Custom Message (Ketik Sendiri) --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message text area */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Pesan WhatsApp *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Ketik pesan Anda..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-sans"
            />
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-0.5">
              Support placeholder: <code className="bg-gray-150 dark:bg-zinc-800 px-0.5 rounded">{"{{nama}}"}</code>, <code className="bg-gray-150 dark:bg-zinc-800 px-0.5 rounded">{"{{sales}}"}</code>, <code className="bg-gray-150 dark:bg-zinc-800 px-0.5 rounded">{"{{tanggal}}"}</code>
            </p>
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
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
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

          {/* Date and Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Tanggal
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Jam
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Repeat and Delay row */}
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Delay Pengiriman
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
          </div>

          {/* Generate follow up checkbox */}
          {!editingSchedule && (
            <div className="p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-2.5">
              <input
                id="generateFollowUp"
                type="checkbox"
                checked={generateFollowUp}
                onChange={(e) => setGenerateFollowUp(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor="generateFollowUp"
                  className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-400 select-none cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  Generate Follow Up Otomatis
                </label>
                <p className="text-[9px] text-emerald-700/80 dark:text-emerald-500/70 mt-0.5 leading-relaxed">
                  Jika diaktifkan, otomatis menjadwalkan follow up di <strong>Hari ke-1, 2, 4, dan 7</strong> menggunakan template berbeda untuk meningkatkan konversi sales.
                </p>
              </div>
            </div>
          )}

          {/* Stop schedule on response checkbox */}
          <div className="p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50/20 dark:bg-red-950/10 flex items-start gap-2.5">
            <input
              id="stopIfRepliedCheckboxModal"
              type="checkbox"
              checked={stopIfReplied}
              onChange={(e) => setStopIfReplied(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
            />
            <div className="flex-1">
              <label
                htmlFor="stopIfRepliedCheckboxModal"
                className="block text-[11px] font-bold text-red-800 dark:text-red-400 select-none cursor-pointer flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3 text-red-500" />
                Matikan Schedule Jika Merespon
              </label>
              <p className="text-[9px] text-red-700/80 dark:text-red-500/70 mt-0.5 leading-relaxed">
                Jika pesan sudah direspon/dibalas oleh customer, seluruh sisa jadwal follow-up untuk nomor tersebut akan otomatis dihentikan (paused).
              </p>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="py-1 px-3 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-1 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              {editingSchedule ? 'Simpan Perubahan' : 'Buat Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
