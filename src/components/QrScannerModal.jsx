import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, CheckCircle, AlertCircle, Camera, CameraOff, Keyboard } from 'lucide-react';
import { AdminApi } from '../services/adminApi';

export default function QrScannerModal({ onClose }) {
  const [ticketCode, setTicketCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [mode, setMode] = useState('manual'); // 'manual' | 'camera'
  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setVerifyResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMode('camera');
      startQrScan();
    } catch (err) {
      setCameraError('Không thể truy cập camera: ' + err.message + '. Vui lòng cấp quyền camera.');
      setMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const switchToManual = () => {
    stopCamera();
    setMode('manual');
    setScanning(false);
  };

  // Attempt to scan QR from video frames using BarcodeDetector API or fallback
  const startQrScan = () => {
    if (!('BarcodeDetector' in window)) {
      // BarcodeDetector not supported, fallback to manual only
      setCameraError('Trình duyệt không hỗ trợ quét mã QR tự động. Vui lòng dùng chế độ nhập tay hoặc trình duyệt Chrome/Edge mới nhất.');
      return;
    }

    setScanning(true);
    let detected = false;

    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

    intervalRef.current = setInterval(async () => {
      if (detected) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          detected = true;
          clearInterval(intervalRef.current);
          setScanning(false);
          setTicketCode(code);
          await verifyCode(code);
        }
      } catch {
        // ignore frame errors
      }
    }, 300);
  };

  const verifyCode = async (code) => {
    if (!code?.trim()) return;
    const res = await AdminApi.verifyTicketQr(code.trim());
    setVerifyResult(res);
    if (res.valid) stopCamera();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;
    await verifyCode(ticketCode);
  };

  const handleReset = () => {
    setVerifyResult(null);
    setTicketCode('');
    if (mode === 'camera') {
      startQrScan();
    }
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-admin-header">
          <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCode size={20} color="var(--admin-primary)" />
            Soát Vé Quầy & Quét QR Code
          </h3>
          <button onClick={() => { stopCamera(); onClose(); }} style={{ color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-admin-body">
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={mode === 'camera' ? 'btn-admin-primary' : 'btn-admin-secondary'}
              style={{ flex: 1, fontSize: '0.85rem' }}
              onClick={mode === 'camera' ? switchToManual : startCamera}
            >
              {mode === 'camera' ? (
                <><CameraOff size={15} /> Dừng Camera</>
              ) : (
                <><Camera size={15} /> Bật Camera Quét QR</>
              )}
            </button>
            <button
              className={mode === 'manual' ? 'btn-admin-primary' : 'btn-admin-secondary'}
              style={{ flex: 1, fontSize: '0.85rem' }}
              onClick={switchToManual}
            >
              <Keyboard size={15} /> Nhập Mã Tay
            </button>
          </div>

          {/* Camera Error */}
          {cameraError && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444',
              color: '#f87171', fontSize: '0.82rem'
            }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />
              {cameraError}
            </div>
          )}

          {/* Camera View */}
          {mode === 'camera' && (
            <div style={{
              position: 'relative', borderRadius: 12, overflow: 'hidden',
              border: '2px solid var(--admin-primary)', marginBottom: 12, background: '#000'
            }}>
              <video
                ref={videoRef}
                style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'cover' }}
                playsInline
                muted
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {/* Scan Overlay */}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{
                  width: 160, height: 160, border: '3px solid rgba(225,29,72,0.8)',
                  borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)'
                }} />
              </div>
              {scanning && (
                <div style={{
                  position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.7)', color: '#34d399', padding: '4px 14px',
                  borderRadius: 20, fontSize: '0.78rem', fontWeight: 600
                }}>
                  Đang quét QR...
                </div>
              )}
            </div>
          )}

          {/* Manual Input */}
          {mode === 'manual' && (
            <div style={{
              background: '#090d16', border: '2px dashed var(--admin-primary)',
              borderRadius: 12, padding: '20px', textAlign: 'center', marginBottom: 12
            }}>
              <QrCode size={48} color="var(--admin-primary)" style={{ margin: '0 auto 10px' }} />
              <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                Nhập mã vé bên dưới để kiểm tra
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Hoặc bật Camera để quét QR tự động
              </div>
            </div>
          )}

          {/* Input + Verify */}
          <form onSubmit={handleVerify} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              required
              className="table-search-input"
              style={{ flex: 1 }}
              placeholder="Nhập mã vé: BK-894210..."
              value={ticketCode}
              onChange={e => setTicketCode(e.target.value)}
            />
            <button type="submit" className="btn-admin-primary">Kiểm tra</button>
          </form>

          {/* Result */}
          {verifyResult && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 10,
              background: verifyResult.valid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${verifyResult.valid ? '#10b981' : '#ef4444'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {verifyResult.valid
                  ? <CheckCircle size={22} color="#10b981" />
                  : <AlertCircle size={22} color="#ef4444" />}
                <strong style={{ color: verifyResult.valid ? '#34d399' : '#f87171' }}>
                  {verifyResult.message}
                </strong>
              </div>
              {verifyResult.booking && (
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.7 }}>
                  <div><strong>Phim:</strong> {verifyResult.booking.movieTitle}</div>
                  <div><strong>Rạp & Phòng:</strong> {verifyResult.booking.cinemaName} — {verifyResult.booking.roomName}</div>
                  <div><strong>Ghế ngồi:</strong> {verifyResult.booking.seats?.join(', ')}</div>
                  <div><strong>Khách hàng:</strong> {verifyResult.booking.userEmail}</div>
                </div>
              )}
              <button className="btn-admin-secondary" style={{ marginTop: 12, fontSize: '0.82rem' }}
                onClick={handleReset}>
                Quét vé tiếp theo
              </button>
            </div>
          )}
        </div>

        <div className="modal-admin-footer">
          <button className="btn-admin-secondary" onClick={() => { stopCamera(); onClose(); }}>
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}