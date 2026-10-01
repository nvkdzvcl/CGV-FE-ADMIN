import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, QrCode, CheckCircle, AlertCircle, Camera, CameraOff, Keyboard, RefreshCw, Upload, Video, Image as ImageIcon } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AdminApi } from '../services/adminApi';

export default function QrScannerModal({ onClose, onSuccessCheckIn }) {
  const [ticketCode, setTicketCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameraLoading, setCameraLoading] = useState(false);
  const [fileScanning, setFileScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef(null);

  // Stop scanner helper
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (isScanningRef.current) {
          isScanningRef.current = false;
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('[stopScanner error]', err);
      }
      scannerRef.current = null;
    }
    setCameraLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Handle successful code decode
  const handleVerifyCode = useCallback(async (code) => {
    if (!code?.trim()) return;
    try {
      const res = await AdminApi.verifyTicketQr(code.trim());
      setVerifyResult(res);
      if (res.valid) {
        await stopScanner();
        if (typeof onSuccessCheckIn === 'function') {
          onSuccessCheckIn(res.booking?.id || code.trim());
        }
      }
    } catch (err) {
      setVerifyResult({
        valid: false,
        message: err.message || 'Mã vé không hợp lệ hoặc đã qua sử dụng.'
      });
    }
  }, [stopScanner, onSuccessCheckIn]);

  // Start Html5Qrcode scanner
  const startScanner = useCallback(async (targetDeviceId = null) => {
    await stopScanner();
    setCameraError(null);
    setVerifyResult(null);
    setCameraLoading(true);
    setMode('camera');

    // Give DOM a small tick to ensure #cgv-qr-reader exists
    setTimeout(async () => {
      const container = document.getElementById('cgv-qr-reader');
      if (!container) {
        setCameraLoading(false);
        return;
      }

      try {
        const html5QrCode = new Html5Qrcode('cgv-qr-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          verbose: false
        });
        scannerRef.current = html5QrCode;

        // Fetch available camera devices
        const cams = await Html5Qrcode.getCameras().catch(() => []);
        setDevices(cams);

        let cameraConfig;
        if (targetDeviceId) {
          cameraConfig = { deviceId: { exact: targetDeviceId } };
          setSelectedDeviceId(targetDeviceId);
        } else if (cams.length > 0) {
          cameraConfig = cams[0].id;
          setSelectedDeviceId(cams[0].id);
        } else {
          cameraConfig = { facingMode: 'environment' };
        }

        await html5QrCode.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewWidth, viewHeight) => {
              const minDim = Math.min(viewWidth, viewHeight);
              return {
                width: Math.min(320, Math.floor(minDim * 0.85)),
                height: Math.min(260, Math.floor(minDim * 0.75))
              };
            },
            aspectRatio: 1.333333
          },
          async (decodedText) => {
            if (decodedText) {
              setTicketCode(decodedText);
              await stopScanner();
              await handleVerifyCode(decodedText);
            }
          },
          () => {
            // Frame search failure, normal while scanning
          }
        );

        isScanningRef.current = true;
        setCameraLoading(false);
      } catch (err) {
        console.error('Camera scan failed to start:', err);
        setCameraLoading(false);
        isScanningRef.current = false;
        setCameraError(
          'Không thể khởi động camera: ' + (err.message || err) +
          '. Vui lòng kiểm tra quyền camera hoặc dùng tính năng tải ảnh / nhập mã.'
        );
      }
    }, 100);
  }, [stopScanner, handleVerifyCode]);

  // Start camera on mount
  useEffect(() => {
    startScanner();
  }, [startScanner]);

  const handleDeviceChange = (e) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    startScanner(devId);
  };

  // Scan from uploaded file / photo
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setCameraError(null);
    setVerifyResult(null);

    try {
      const dummyId = 'cgv-qr-file-dummy';
      let dummyContainer = document.getElementById(dummyId);
      if (!dummyContainer) {
        dummyContainer = document.createElement('div');
        dummyContainer.id = dummyId;
        dummyContainer.style.display = 'none';
        document.body.appendChild(dummyContainer);
      }

      const fileScanner = new Html5Qrcode(dummyId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.PDF_417,
        ],
        verbose: false
      });

      const decodedText = await fileScanner.scanFile(file, true);
      await fileScanner.clear();

      if (decodedText) {
        setTicketCode(decodedText);
        await handleVerifyCode(decodedText);
      }
    } catch (err) {
      setCameraError('Không tìm thấy mã QR hoặc Barcode rõ ràng trong ảnh này. Vui lòng thử ảnh chụp nét hơn hoặc nhập mã tay.');
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;
    await handleVerifyCode(ticketCode);
  };

  const handleReset = () => {
    setVerifyResult(null);
    setTicketCode('');
    if (mode === 'camera') {
      startScanner(selectedDeviceId);
    }
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose} style={{ padding: 16 }}>
      <div
        className="modal-admin-window"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 580,
          width: '96vw',
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255,255,255,0.08)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div className="modal-admin-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontWeight: 700 }}>
            <span style={{ padding: 6, borderRadius: 8, background: 'rgba(225, 29, 72, 0.15)', border: '1px solid rgba(225, 29, 72, 0.3)', display: 'flex' }}>
              <QrCode size={18} color="#f43f5e" />
            </span>
            Soát Vé Quầy & Quét QR Code
          </h3>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            style={{ color: 'var(--admin-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-admin-body" style={{ padding: 20 }}>
          {/* Mode Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              className={mode === 'camera' ? 'btn-admin-primary' : 'btn-admin-secondary'}
              style={{
                fontSize: '0.82rem',
                padding: '8px 10px',
                background: mode === 'camera' ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
              onClick={() => {
                if (mode !== 'camera') {
                  startScanner(selectedDeviceId);
                }
              }}
            >
              <Camera size={14} /> Camera Quét
            </button>
            <button
              type="button"
              className={mode === 'upload' ? 'btn-admin-primary' : 'btn-admin-secondary'}
              style={{
                fontSize: '0.82rem',
                padding: '8px 10px',
                background: mode === 'upload' ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
              onClick={() => {
                stopScanner();
                setMode('upload');
              }}
            >
              <Upload size={14} /> Tải Ảnh Vé
            </button>
            <button
              type="button"
              className={mode === 'manual' ? 'btn-admin-primary' : 'btn-admin-secondary'}
              style={{
                fontSize: '0.82rem',
                padding: '8px 10px',
                background: mode === 'manual' ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
              onClick={() => {
                stopScanner();
                setMode('manual');
              }}
            >
              <Keyboard size={14} /> Nhập Mã Tay
            </button>
          </div>

          {/* Camera Device Selector (if multiple cameras detected) */}
          {mode === 'camera' && devices.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
              <Video size={14} color="#94a3b8" />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Thiết bị camera:</span>
              <select
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {devices.map((d, idx) => (
                  <option key={d.id || idx} value={d.id} style={{ background: '#1e293b', color: '#fff' }}>
                    {d.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Camera Error Notice */}
          {cameraError && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444',
              color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <AlertCircle size={16} />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Camera Viewfinder Container */}
          <div style={{ display: mode === 'camera' ? 'block' : 'none', marginBottom: 14 }}>
            <div style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              border: '2px solid rgba(225, 29, 72, 0.6)',
              background: '#070b13',
              minHeight: 260
            }}>
              {cameraLoading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#070b13', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8', fontSize: '0.82rem' }}>
                  <RefreshCw size={26} className="spin" color="#f43f5e" />
                  <span>Đang khởi động camera quét QR & Barcode...</span>
                </div>
              )}

              {/* Html5Qrcode target element */}
              <div id="cgv-qr-reader" style={{ width: '100%' }} />
            </div>

            <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.74rem', color: '#94a3b8' }}>
              💡 Giữ vé cách camera khoảng 15-25cm, hướng mã QR hoặc mã vạch vào giữa khung đỏ
            </div>
          </div>

          {/* Upload Photo Mode */}
          {mode === 'upload' && (
            <div style={{
              background: '#070b13',
              border: '2px dashed rgba(225, 29, 72, 0.4)',
              borderRadius: 12,
              padding: '30px 20px',
              textAlign: 'center',
              marginBottom: 14,
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(225, 29, 72, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#f43f5e' }}>
                <ImageIcon size={24} />
              </div>
              <div style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 600 }}>
                {fileScanning ? 'Đang phân tích hình ảnh vé...' : 'Chọn hoặc thả ảnh vé chứa mã QR / Barcode'}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Hỗ trợ ảnh chụp màn hình, ảnh vé PDF, vé điện tử JPG / PNG
              </div>
              <button
                type="button"
                className="btn-admin-secondary"
                style={{ marginTop: 14, fontSize: '0.8rem', padding: '6px 16px' }}
                disabled={fileScanning}
              >
                {fileScanning ? 'Đang quét...' : 'Chọn file ảnh'}
              </button>
            </div>
          )}

          {/* Manual Input Placeholder */}
          {mode === 'manual' && (
            <div style={{
              background: '#070b13',
              border: '2px dashed rgba(225, 29, 72, 0.4)',
              borderRadius: 12,
              padding: '24px 20px',
              textAlign: 'center',
              marginBottom: 14
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(225, 29, 72, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#f43f5e' }}>
                <QrCode size={22} />
              </div>
              <div style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 600 }}>
                Nhập mã vé hoặc mã đặt chỗ bên dưới
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Hệ thống sẽ tự động tra cứu và đổi trạng thái vé sang ĐÃ CHECK-IN
              </div>
            </div>
          )}

          {/* Code Input Form */}
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              required
              className="table-search-input"
              style={{ flex: 1, padding: '9px 12px', fontSize: '0.86rem' }}
              placeholder="Nhập mã vé: BK-894210 hoặc mã QR..."
              value={ticketCode}
              onChange={e => setTicketCode(e.target.value)}
            />
            <button
              type="submit"
              className="btn-admin-primary"
              style={{ padding: '9px 18px', fontSize: '0.86rem', background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
            >
              Kiểm tra
            </button>
          </form>

          {/* Result Card */}
          {verifyResult && (
            <div style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 12,
              background: verifyResult.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${verifyResult.valid ? '#10b981' : '#ef4444'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {verifyResult.valid ? (
                  <CheckCircle size={22} color="#10b981" />
                ) : (
                  <AlertCircle size={22} color="#ef4444" />
                )}
                <strong style={{ color: verifyResult.valid ? '#34d399' : '#f87171', fontSize: '0.92rem' }}>
                  {verifyResult.message}
                </strong>
              </div>

              {verifyResult.booking && (
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.8, background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 8, marginTop: 8 }}>
                  <div><strong>Mã đơn:</strong> #{verifyResult.booking.id}</div>
                  <div><strong>Phim:</strong> {verifyResult.booking.movieTitle}</div>
                  <div><strong>Rạp & Phòng:</strong> {verifyResult.booking.cinemaName} — {verifyResult.booking.roomName}</div>
                  <div><strong>Ghế ngồi:</strong> <span style={{ color: '#fbbf24', fontWeight: 700 }}>{Array.isArray(verifyResult.booking.seats) ? verifyResult.booking.seats.join(', ') : verifyResult.booking.seats}</span></div>
                  <div><strong>Khách hàng:</strong> {verifyResult.booking.userEmail}</div>
                </div>
              )}

              <button
                type="button"
                className="btn-admin-secondary"
                style={{ marginTop: 12, fontSize: '0.8rem', padding: '6px 14px' }}
                onClick={handleReset}
              >
                Quét vé tiếp theo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-admin-footer" style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            className="btn-admin-secondary"
            onClick={() => { stopScanner(); onClose(); }}
            style={{ fontSize: '0.84rem' }}
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {/* Override html5-qrcode internal styles to look stunning & native */}
      <style>{`
        #cgv-qr-reader {
          border: none !important;
        }
        #cgv-qr-reader video {
          border-radius: 10px !important;
          object-fit: cover !important;
          max-height: 280px !important;
        }
        #cgv-qr-reader img {
          display: none !important;
        }
        #cgv-qr-reader__scan_region {
          border: 2px solid rgba(225, 29, 72, 0.7) !important;
          border-radius: 12px !important;
          box-shadow: 0 0 15px rgba(225, 29, 72, 0.3) !important;
        }
        #cgv-qr-reader__dashboard {
          display: none !important;
        }
      `}</style>
    </div>
  );
}