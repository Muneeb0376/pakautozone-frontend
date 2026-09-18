'use client';
import { useLang } from '@/lib/i18nContext';
import { useState } from 'react';

export default function BulkImport() {
  const { t } = useLang();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const csv = 'title,brand,model,variant,year,price,mileage,bodyType,transmission,fuelType,condition,color,engineCC,city,description\n2022 Toyota Corolla GLi,Toyota,Corolla,GLi,2022,4500000,25000,SEDAN,MANUAL,PETROL,USED,White,1800,Lahore,Well maintained car\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'car-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return alert(t('dashboard.selectCsv'));
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API}/cars/bulk-import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setResult(data);
    } catch {
      alert(t('dashboard.importFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{t('dashboard.bulkImportCars')}</h3>
        <button onClick={downloadTemplate} className="text-xs text-blue-600 hover:underline">
          ⬇️ {t('dashboard.downloadTemplate')}
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
        <p className="text-2xl mb-2">📂</p>
        <p className="text-sm text-gray-500 mb-3">{t('dashboard.uploadCsv')}</p>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])}
          className="hidden" id="csv-upload" />
        <label htmlFor="csv-upload"
          className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">
          {file ? file.name : t('dashboard.chooseCsv')}
        </label>
      </div>

      {file && (
        <button onClick={handleUpload} disabled={loading}
          className="w-full mt-3 bg-blue-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('dashboard.importing') : t('dashboard.startImport')}
        </button>
      )}

      {result && (
        <div className="mt-4 space-y-2">
          <p className="text-green-600 text-sm">✅ {result.success} {t('dashboard.listingsImported')}</p>
          {result.failed > 0 && <p className="text-red-500 text-sm">❌ {result.failed} {t('dashboard.rowsFailed')}</p>}
        </div>
      )}
    </div>
  );
}