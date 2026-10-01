import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, QrCode, CheckCircle, AlertCircle, Camera, CameraOff, Keyboard, RefreshCw, Video } from 'lucide-react';
import jsQR from 'jsqr';
import { AdminApi } from '../services/adminApi';

export default function QrScannerModal({ onClose, onSuccessCheckIn }) {
  const [ticketCode, setTicketCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start QR scanning loop using BarcodeDetector + jsQR fallback
  const startQrScan = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setScanning(true);
    let detected = false;

    let barcodeDetector = null;
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        barcodeDetector = null;
      }
    }

    intervalRef.current = setInterval(async () => {
      if (detected) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

      // 1. Try native BarcodeDetector if available
      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            if (rawVal) {
              detected = true;
              clearInterval(intervalRef.current);
              setScanning(false);
              setTicketCode(rawVal);
              await handleVerifyCode(rawVal);
              return;
            }
          }
        } catch {
          // fall through to jsQR
        }
      }

      // 2. Fallback to jsQR canvas decode
      try {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });
          if (code && code.data) {
            detected = true;
            clearInterval(intervalRef.current);
            setScanning(false);
            setTicketCode(code.data);
            await handleVerifyCode(code.data);
            return;
          }
        }
      } catch {
        // ignore frame decoding errors
      }
    }, 200);
  }, []);

  // Start Camera with deviceId selection & resilient constraints
  const startCamera = useCallback(async (targetDeviceId = null) => {
    setCameraError(null);
    setVerifyResult(null);
    setCameraLoading(true);

    // Stop current stream before requesting new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      let constraints;
      if (targetDeviceId) {
        constraints = {
          video: {
            deviceId: { exact: targetDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      } else {
        // Ideal constraint for desktop/laptop/mobile
        constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { ideal: 'environment' }
          }
        };
      }

      let activeStream;
      try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err1) {
        console.warn('Ideal camera constraints failed, attempting fallback to basic video:', err1);
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = activeStream;
      setStream(activeStream);

      // Enumerate devices so user can pick between FaceTime, iPhone Continuity, or USB Cam
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevs);
        const activeTrack = activeStream.getVideoTracks()[0];
        const currentId = activeTrack?.getSettings()?.deviceId || (videoDevs[0]?.deviceId || '');
        setSelectedDeviceId(targetDeviceId || currentId);
      } catch (enumErr) {
        console.warn('Enumerate devices failed:', enumErr);
      }

      setMode('camera');
      setCameraLoading(false);
      startQrScan();
    } catch (err) {
      console.error('Camera open failed:', err);
      setCameraLoading(false);
      setCameraError('Không thể mở camera: ' + err.message + '. Vui lòng kiểm tra quyền camera của trình duyệt.');
      setMode('manual');
    }
  }, [startQrScan]);

  // Ensure stream is properly attached to video element on mount & mode changes
  useEffect(() => {
    if (mode === 'camera' && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.play().catch(err => {
        console.warn('Video auto-play interrupted:', err);
      });
    }
  }, [stream, mode]);

  // Auto-start camera when modal opens
  useEffect(() => {
    startCamera();
  }, []);

  const handleDeviceChange = (e) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    startCamera(devId);
  };

  const switchToManual = () => {
    stopCamera();
    setMode('manual');
  };

  const handleVerifyCode = async (code) => {
    if (!code?.trim()) return;
    try {
      const res = await AdminApi.verifyTicketQr(code.trim());
      setVerifyResult(res);
      if (res.valid) {
        stopCamera();
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
      startCamera(selectedDeviceId);
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
            onClick={() => { stopCamera(); onClose(); }}
            style={{ color: 'var(--admin-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-admin-body" style={{ padding: 20 }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              className={mode === 'camera' ? 'btn-admin-primary' : 'btn-admin-secondary'}
              style={{
                flex: 1,
                fontSize: '0.84rem',
                padding: '8px 14px',
                background: mode === 'camera' ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined
              }}
              onClick={() => {
                if (mode === 'camera') {
                  stopCamera();
                  setMode('manual');
                } else {
                  startCamera(selectedDeviceId);
                }
              }}
            >
              {mode === 'camera' && stream ? (
                <><CameraOff size={15} /> Dừng Camera</>
              ) : (
                <><Camera size={15} /> Bật Camera Quét QR</>
              )}
            </button>
            <button
              type="button"
              className={mode === 'manual' ? 'btn-admin-primary' : 'btn-admin-secondary'}
              style={{
                flex: 1,
                fontSize: '0.84rem',
                padding: '8px 14px',
                background: mode === 'manual' ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined
              }}
              onClick={switchToManual}
            >
              <Keyboard size={15} /> Nhập Mã Thủ Công
            </button>
          </div>

          {/* Camera Device Selector (if multiple cameras available) */}
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
                  <option key={d.deviceId || idx} value={d.deviceId} style={{ background: '#1e293b', color: '#fff' }}>
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

          {/* Camera Live Viewfinder */}
          {mode === 'camera' && (
            <div style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              border: '2px solid rgba(225, 29, 72, 0.6)',
              marginBottom: 14,
              background: '#070b13',
              height: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {cameraLoading && (
                <div style={{ position: 'absolute', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.82rem' }}>
                  <RefreshCw size={24} className="spin" color="#f43f5e" />
                  <span>Đang kết nối camera...</span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  videoRef.current?.play().catch(() => {});
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Laser Target Box Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    width: 170,
                    height: 170,
                    position: 'relative',
                    borderRadius: 12,
                    border: '2px solid rgba(225, 29, 72, 0.4)',
                    boxShadow: '0 0 20px rgba(225, 29, 72, 0.25)'
                  }}
                >
                  {/* 4 Corner Markers */}
                  <span style={{ position: 'absolute', top: -2, left: -2, width: 16, height: 16, borderTop: '3px solid #f43f5e', borderLeft: '3px solid #f43f5e', borderTopLeftRadius: 6 }} />
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderTop: '3px solid #f43f5e', borderRight: '3px solid #f43f5e', borderTopRightRadius: 6 }} />
                  <span style={{ position: 'absolute', bottom: -2, left: -2, width: 16, height: 16, borderBottom: '3px solid #f43f5e', borderLeft: '3px solid #f43f5e', borderBottomLeftRadius: 6 }} />
                  <span style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderBottom: '3px solid #f43f5e', borderRight: '3px solid #f43f5e', borderBottomRightRadius: 6 }} />

                  {/* Scanning Laser Line */}
                  {scanning && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 4,
                        right: 4,
                        height: 2,
                        background: 'linear-gradient(90deg, transparent, #f43f5e, #fda4af, #f43f5e, transparent)',
                        boxShadow: '0 0 8px #f43f5e',
                        animation: 'scanLaser 2s ease-in-out infinite'
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  color: scanning ? '#34d399' : '#94a3b8',
                  padding: '4px 14px',
                  borderRadius: 20,
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: scanning ? '#10b981' : '#64748b' }} />
                {scanning ? 'Đang căn quét mã QR...' : 'Tạm dừng quét'}
              </div>
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
                Hoặc bấm "Bật Camera" để quét trực tiếp mã QR trên vé khách hàng
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
            onClick={() => { stopCamera(); onClose(); }}
            style={{ fontSize: '0.84rem' }}
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {/* Laser Animation Style */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 6px; }
          50% { top: calc(100% - 8px); }
          100% { top: 6px; }
        }
      `}</style>
    </div>
  );
}