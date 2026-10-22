'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Asset } from '@/types';
import { Printer, X, CheckSquare, Square } from 'lucide-react';

interface PrintQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  initialSelectedAssetId?: string;
}

interface AssetQR {
  asset: Asset;
  qrDataUrl: string;
}

export const PrintQRModal: React.FC<PrintQRModalProps> = ({
  isOpen,
  onClose,
  assets,
  initialSelectedAssetId,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qrItems, setQrItems] = useState<AssetQR[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSelectedAssetId) {
      setSelectedIds([initialSelectedAssetId]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  }, [initialSelectedAssetId, assets, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const generateQRCodes = async () => {
      setLoading(true);
      const itemsToRender = assets.filter(a => selectedIds.includes(a.id));
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matmotmimedia.vn';

      const results = await Promise.all(
        itemsToRender.map(async asset => {
          try {
            const targetUrl = `${origin}/assets/${asset.code}`;
            const qrDataUrl = await QRCode.toDataURL(targetUrl, {
              width: 300,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#FFFFFF',
              },
            });
            return { asset, qrDataUrl };
          } catch (e) {
            console.error('Lỗi tạo QR:', e);
            return null;
          }
        })
      );

      setQrItems(results.filter(Boolean) as AssetQR[]);
      setLoading(false);
    };

    generateQRCodes();
  }, [selectedIds, assets, isOpen]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {/* Controls Container - Hidden during Print */}
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col no-print shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-orange-600" />
              In Tem Dán Mã QR Thiết Bị
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              In tem dán lên máy ảnh, lens, đèn để quét nhanh bằng camera điện thoại
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold"
          >
            {selectedIds.length === assets.length ? (
              <CheckSquare className="w-4 h-4 text-orange-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Chọn tất cả ({selectedIds.length}/{assets.length})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedIds.length === 0 || loading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-orange-600/25 transition"
            >
              <Printer className="w-4 h-4" />
              In ngay ({selectedIds.length} tem)
            </button>
          </div>
        </div>

        {/* Select items selector chip list */}
        <div className="p-3 border-b border-slate-100 flex flex-wrap gap-2 max-h-28 overflow-y-auto bg-slate-50/50">
          {assets.map(a => {
            const isSelected = selectedIds.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggleSelect(a.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 font-medium ${
                  isSelected 
                    ? 'bg-orange-100 text-orange-800 border-orange-300 font-bold' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="font-mono">{a.code}</span>
                <span className="truncate max-w-[120px]">{a.name}</span>
              </button>
            );
          })}
        </div>

        {/* Label Preview Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Đang tạo mã QR...</div>
          ) : qrItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">Chưa chọn thiết bị nào để in.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {qrItems.map(({ asset, qrDataUrl }) => (
                <div
                  key={asset.id}
                  className="bg-white text-black p-3.5 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-between text-center shadow-sm"
                >
                  <div className="text-[11px] font-black tracking-wider uppercase text-slate-900 border-b border-slate-200 pb-1 w-full">
                    MẮT MỘT MÍ MEDIA
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={asset.code}
                    className="w-32 h-32 object-contain my-1"
                  />
                  <div className="font-mono font-black text-sm text-black tracking-wide bg-slate-100 px-2 py-0.5 rounded w-full">
                    {asset.code}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-1 w-full">
                    {asset.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Quét QR mượn / trả / kiểm kê
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRINT-ONLY CONTAINER (Standard A4 Sticker sheet format) */}
      <div className="hidden print:block fixed inset-0 bg-white p-4">
        <div className="grid grid-cols-3 gap-3">
          {qrItems.map(({ asset, qrDataUrl }) => (
            <div
              key={`print-${asset.id}`}
              className="qr-label-card p-3 border-2 border-black flex flex-col items-center justify-center text-center rounded-lg"
              style={{ minHeight: '160px' }}
            >
              <div className="text-[10px] font-black tracking-wider uppercase text-black border-b border-black pb-0.5 w-full">
                MẮT MỘT MÍ MEDIA
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={asset.code}
                className="w-24 h-24 object-contain my-1"
              />
              <div className="font-mono font-black text-xs text-black tracking-wide border border-black px-1.5 py-0.5 rounded w-full">
                {asset.code}
              </div>
              <div className="text-[10px] font-bold text-black mt-1 leading-tight line-clamp-1">
                {asset.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
