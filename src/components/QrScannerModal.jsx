import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, QrCode, CheckCircle2, AlertTriangle, AlertCircle, Camera,
  Keyboard, RefreshCw, Upload, Video, Image as ImageIcon,
  Volume2, VolumeX, History, Sparkles, Check, Clock
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AdminApi } from '../services/adminApi';

// Synthesize pleasant sound effects using Web Audio API (No external sound files required)
function playScanSound(type = 'success', enabled = true) {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'success') {
      // Harmonic 2-tone melodic chime (880Hz -> 1320Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);

      // Haptic vibration feedback for mobile / tablet devices
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }
    } else {
      // 2-tone warning alert buzzer (220Hz -> 160Hz sawtooth)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // Haptic vibration alert for error
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 80, 150]);
      }
    }
  } catch (e) {
    console.warn('[Audio play blocked/unsupported]', e);
  }
}

export default function QrScannerModal({ onClose, onSuccessCheckIn, onErrorCheckIn }) {
  const [ticketCode, setTicketCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameraLoading, setCameraLoading] = useState(false);
  const [fileScanning, setFileScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Gate staff utilities
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoScanNext, setAutoScanNext] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef(null);
  const countdownTimerRef = useRef(null);

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
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [stopScanner]);

  // Start Html5Qrcode scanner
  const startScanner = useCallback(async (targetDeviceId = null) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      setCountdown(0);
    }
    await stopScanner();
    setCameraError(null);
    setVerifyResult(null);
    setCameraLoading(true);
    setMode('camera');

    // Give DOM a tick to ensure #cgv-qr-reader is mounted
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

        // Fetch available cameras
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
              // Trigger verification immediately
              handleVerifyCode(decodedText);
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
          '. Vui lòng kiểm tra quyền truy cập camera hoặc dùng tính năng Tải ảnh / Nhập mã.'
        );
      }
    }, 120);
  }, [stopScanner]);

  // Handle verify ticket code
  const handleVerifyCode = useCallback(async (code) => {
    if (!code?.trim()) return;
    setIsVerifying(true);
    setCameraError(null);

    try {
      const res = await AdminApi.verifyTicketQr(code.trim());
      setVerifyResult(res);
      setIsVerifying(false);

      if (res.valid) {
        // 1. Play success audio chime
        playScanSound('success', soundEnabled);

        // 2. Add to scan history
        setScanHistory(prev => [
          {
            id: Date.now(),
            valid: true,
            code: res.booking?.id || code.trim(),
            time: new Date().toLocaleTimeString('vi-VN'),
            movieTitle: res.booking?.movieTitle,
            seats: res.booking?.seats,
            message: res.message
          },
          ...prev.slice(0, 9)
        ]);

        // 3. Notify parent component
        if (typeof onSuccessCheckIn === 'function') {
          onSuccessCheckIn(res.booking?.id || code.trim(), res);
        }

        // 4. If auto scan next is enabled, start countdown
        if (autoScanNext && mode === 'camera') {
          setCountdown(2);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownTimerRef.current);
                handleReset();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        // 1. Play warning error buzzer
        playScanSound('error', soundEnabled);

        // 2. Add to scan history
        setScanHistory(prev => [
          {
            id: Date.now(),
            valid: false,
            code: res.code || code.trim(),
            time: new Date().toLocaleTimeString('vi-VN'),
            message: res.message || 'Vé không hợp lệ hoặc đã sử dụng'
          },
          ...prev.slice(0, 9)
        ]);

        // 3. Notify parent component
        if (typeof onErrorCheckIn === 'function') {
          onErrorCheckIn(res.message || 'Soát vé không thành công', res.code || code.trim());
        }
      }
    } catch (err) {
      setIsVerifying(false);
      const errMsg = err.message || 'Lỗi kết nối máy chủ soát vé';
      setVerifyResult({
        valid: false,
        code: code.trim(),
        message: errMsg
      });
      playScanSound('error', soundEnabled);
      if (typeof onErrorCheckIn === 'function') {
        onErrorCheckIn(errMsg, code.trim());
      }
    }
  }, [soundEnabled, autoScanNext, mode, onSuccessCheckIn, onErrorCheckIn]);

  // Start camera on mount
  useEffect(() => {
    startScanner();
  }, [startScanner]);

  // Keyboard shortcut listener: Space/Enter to scan next, Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && verifyResult) {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'Escape') {
        stopScanner();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [verifyResult, onClose, stopScanner]);

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
      playScanSound('error', soundEnabled);
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
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      setCountdown(0);
    }
    setVerifyResult(null);
    setTicketCode('');
    if (mode === 'camera') {
      startScanner(selectedDeviceId);
    }
  };

  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      setCountdown(0);
    }
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose} style={{ padding: 16 }}>
      <div
        className="modal-admin-window"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 600,
          width: '96vw',
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255,255,255,0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="modal-admin-header" style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ padding: 6, borderRadius: 8, background: 'rgba(225, 29, 72, 0.15)', border: '1px solid rgba(225, 29, 72, 0.3)', display: 'flex' }}>
              <QrCode size={18} color="#f43f5e" />
            </span>
            <div>
              <h3 style={{ fontSize: '1.02rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                Cổng Soát Vé Quầy & Quét QR Code
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                Tự động kiểm tra trạng thái vé và phát thông báo âm thanh tức thì
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Audio Toggle Button */}
            <button
              type="button"
              onClick={() => setSoundEnabled(prev => !prev)}
              className="btn-admin-secondary"
              title={soundEnabled ? 'Đang bật âm báo khi quét (Bấm để tắt)' : 'Đang tắt âm báo (Bấm để bật)'}
              style={{ padding: '6px 10px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 5, color: soundEnabled ? '#34d399' : '#94a3b8' }}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="hide-mobile">{soundEnabled ? 'Bật chuông' : 'Tắt chuông'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => { stopScanner(); onClose(); }}
              style={{ color: 'var(--admin-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-admin-body" style={{ padding: 18, overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>

          {/* Mode Switcher & Tools */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={mode === 'camera' && !showHistory ? 'btn-admin-primary' : 'btn-admin-secondary'}
                style={{
                  fontSize: '0.8rem',
                  padding: '7px 12px',
                  background: mode === 'camera' && !showHistory ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined,
                  display: 'flex', alignItems: 'center', gap: 6
                }}
                onClick={() => {
                  setShowHistory(false);
                  if (mode !== 'camera') {
                    startScanner(selectedDeviceId);
                  }
                }}
              >
                <Camera size={14} /> Camera Quét
              </button>
              <button
                type="button"
                className={mode === 'upload' && !showHistory ? 'btn-admin-primary' : 'btn-admin-secondary'}
                style={{
                  fontSize: '0.8rem',
                  padding: '7px 12px',
                  background: mode === 'upload' && !showHistory ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined,
                  display: 'flex', alignItems: 'center', gap: 6
                }}
                onClick={() => {
                  setShowHistory(false);
                  stopScanner();
                  setMode('upload');
                }}
              >
                <Upload size={14} /> Tải Ảnh Vé
              </button>
              <button
                type="button"
                className={mode === 'manual' && !showHistory ? 'btn-admin-primary' : 'btn-admin-secondary'}
                style={{
                  fontSize: '0.8rem',
                  padding: '7px 12px',
                  background: mode === 'manual' && !showHistory ? 'linear-gradient(135deg, #e11d48, #be123c)' : undefined,
                  display: 'flex', alignItems: 'center', gap: 6
                }}
                onClick={() => {
                  setShowHistory(false);
                  stopScanner();
                  setMode('manual');
                }}
              >
                <Keyboard size={14} /> Nhập Mã Tay
              </button>
            </div>

            {/* History Toggle */}
            <button
              type="button"
              className={showHistory ? 'btn-admin-primary' : 'btn-admin-secondary'}
              style={{
                fontSize: '0.78rem',
                padding: '6px 10px',
                background: showHistory ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : undefined,
                display: 'flex', alignItems: 'center', gap: 6
              }}
              onClick={() => setShowHistory(prev => !prev)}
              title="Xem lịch sử quét vé trong phiên này"
            >
              <History size={14} /> Lịch sử ({scanHistory.length})
            </button>
          </div>

          {/* History View */}
          {showHistory ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#fff' }}>📋 Lịch sử soát vé trong ca trực:</span>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  ← Quay lại camera
                </button>
              </div>

              {scanHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '0.82rem' }}>
                  Chưa có lượt quét nào trong phiên làm việc này.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {scanHistory.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: item.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${item.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.valid ? <CheckCircle2 size={16} color="#10b981" /> : <AlertTriangle size={16} color="#ef4444" />}
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: item.valid ? '#34d399' : '#f87171' }}>
                            {item.valid ? `Đơn #${item.code}` : `Lỗi: ${item.message}`}
                          </div>
                          {item.movieTitle && (
                            <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                              {item.movieTitle} {item.seats ? `— Ghế: ${Array.isArray(item.seats) ? item.seats.join(', ') : item.seats}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Camera Device Selector (if multiple cameras detected) */}
              {mode === 'camera' && devices.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Video size={14} color="#94a3b8" />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Đổi camera:</span>
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

              {/* Camera Viewfinder */}
              <div style={{ display: mode === 'camera' && !verifyResult ? 'block' : 'none', marginBottom: 14 }}>
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
                      <span>Đang khởi động camera quét mã...</span>
                    </div>
                  )}

                  {/* Html5Qrcode target element */}
                  <div id="cgv-qr-reader" style={{ width: '100%' }} />

                  {/* Scanning Laser Animation Line */}
                  {!cameraLoading && (
                    <div className="scanner-laser-line" />
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.74rem', color: '#94a3b8' }}>
                  <span>💡 Hướng mã QR trên vé hoặc điện thoại khách vào giữa khung ngắm</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: autoScanNext ? '#34d399' : '#94a3b8' }}>
                    <input
                      type="checkbox"
                      checked={autoScanNext}
                      onChange={e => setAutoScanNext(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Tự quét tiếp (2s)
                  </label>
                </div>
              </div>

              {/* Upload Photo Mode */}
              {mode === 'upload' && !verifyResult && (
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
                    Hỗ trợ ảnh chụp màn hình vé, ảnh PDF, vé điện tử JPG / PNG
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
              {mode === 'manual' && !verifyResult && (
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
                    Hệ thống sẽ đối soát và tự động đổi trạng thái vé sang ĐÃ SỬ DỤNG
                  </div>
                </div>
              )}

              {/* Code Input Form */}
              <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input
                  type="text"
                  required
                  className="table-search-input"
                  style={{ flex: 1, padding: '9px 12px', fontSize: '0.86rem' }}
                  placeholder="Nhập mã vé hoặc dán mã QR (ví dụ: BK-894210)..."
                  value={ticketCode}
                  onChange={e => setTicketCode(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="btn-admin-primary"
                  style={{ padding: '9px 18px', fontSize: '0.86rem', background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
                >
                  {isVerifying ? 'Đang kiểm tra...' : 'Kiểm tra'}
                </button>
              </form>

              {/* Loading Verification Indicator */}
              {isVerifying && (
                <div style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontSize: '0.88rem',
                  marginBottom: 14
                }}>
                  <RefreshCw size={18} className="spin" />
                  <span>Đang kết nối máy chủ để đối soát thông tin vé...</span>
                </div>
              )}

              {/* ─── KẾT QUẢ QUÉT: THÔNG BÁO THÀNH CÔNG / THÔNG BÁO LỖI ─── */}
              {verifyResult && (
                <div
                  className={verifyResult.valid ? 'scan-banner-success' : 'scan-banner-error'}
                  style={{
                    padding: 18,
                    borderRadius: 14,
                    background: verifyResult.valid
                      ? 'linear-gradient(180deg, rgba(6, 78, 59, 0.85) 0%, rgba(4, 47, 36, 0.95) 100%)'
                      : 'linear-gradient(180deg, rgba(127, 29, 29, 0.85) 0%, rgba(69, 10, 10, 0.95) 100%)',
                    border: `1.5px solid ${verifyResult.valid ? '#10b981' : '#ef4444'}`,
                    boxShadow: verifyResult.valid
                      ? '0 12px 30px rgba(16, 185, 129, 0.25)'
                      : '0 12px 30px rgba(239, 68, 68, 0.25)',
                    marginBottom: 10
                  }}
                >
                  {/* Banner Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: verifyResult.valid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: `2px solid ${verifyResult.valid ? '#10b981' : '#ef4444'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {verifyResult.valid ? (
                        <CheckCircle2 size={26} color="#10b981" />
                      ) : (
                        <AlertTriangle size={26} color="#ef4444" />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '1.08rem',
                        fontWeight: 800,
                        color: verifyResult.valid ? '#34d399' : '#f87171',
                        letterSpacing: '0.3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        {verifyResult.valid ? 'SOÁT VÉ THÀNH CÔNG!' : 'SOÁT VÉ THẤT BẠI / VÉ KHÔNG HỢP LỆ!'}
                      </div>

                      <div style={{
                        fontSize: '0.88rem',
                        color: verifyResult.valid ? '#e2e8f0' : '#fecaca',
                        marginTop: 4,
                        fontWeight: 500,
                        lineHeight: 1.4
                      }}>
                        {verifyResult.message}
                      </div>

                      {/* Display Scanned Code for cross checking if error */}
                      {!verifyResult.valid && verifyResult.code && (
                        <div style={{
                          marginTop: 6,
                          fontSize: '0.76rem',
                          color: '#94a3b8',
                          background: 'rgba(0,0,0,0.3)',
                          padding: '4px 8px',
                          borderRadius: 6,
                          display: 'inline-block',
                          fontFamily: 'monospace'
                        }}>
                          Mã đã quét: {verifyResult.code}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Details Card (When Valid) */}
                  {verifyResult.valid && verifyResult.booking && (
                    <div style={{
                      marginTop: 14,
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.84rem',
                      color: '#cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Mã đơn vé:</span>{' '}
                          <strong style={{ color: '#fff', fontFamily: 'monospace' }}>#{verifyResult.booking.id}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Khách hàng:</span>{' '}
                          <strong style={{ color: '#fff' }}>{verifyResult.booking.userEmail}</strong>
                        </div>
                      </div>

                      <div>
                        <span style={{ color: '#94a3b8' }}>Phim chiếu:</span>{' '}
                        <strong style={{ color: '#38bdf8' }}>{verifyResult.booking.movieTitle}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#94a3b8' }}>Rạp & Phòng:</span>{' '}
                        <strong style={{ color: '#fff' }}>{verifyResult.booking.cinemaName} — {verifyResult.booking.roomName}</strong>
                      </div>

                      {/* Seat Badges */}
                      <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.8rem' }}>GHẾ VÀO PHÒNG:</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(Array.isArray(verifyResult.booking.seats) ? verifyResult.booking.seats : [verifyResult.booking.seats]).map((seat, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                padding: '3px 10px',
                                borderRadius: 6,
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: '#000',
                                fontWeight: 800,
                                fontSize: '0.85rem'
                              }}
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions / Next Scan Countdown */}
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    {verifyResult.valid ? (
                      <>
                        {autoScanNext && countdown > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: '0.82rem' }}>
                              <Clock size={15} className="spin" />
                              <span>Tự động quét người tiếp theo sau <strong>{countdown}s</strong>...</span>
                            </div>
                            <button
                              type="button"
                              onClick={cancelCountdown}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.76rem', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                              (Dừng đếm)
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Nhấn Space hoặc nút bên dưới để quét tiếp
                          </span>
                        )}

                        <button
                          type="button"
                          className="btn-admin-primary"
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            padding: '8px 18px',
                            fontSize: '0.84rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                          onClick={handleReset}
                        >
                          <Check size={16} /> Quét vé tiếp theo (Space)
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
                          Vui lòng kiểm tra lại vé của khách hoặc quét lại
                        </span>

                        <button
                          type="button"
                          className="btn-admin-primary"
                          style={{
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            padding: '8px 18px',
                            fontSize: '0.84rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                          onClick={handleReset}
                        >
                          <RefreshCw size={15} /> Thử lại / Quét mã khác
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="modal-admin-footer" style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
            CGV Gate Check-in • Hỗ trợ QR Code & Barcode
          </div>
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

      {/* Embedded CSS & Laser Scanning Animation */}
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
          border: 2px solid rgba(225, 29, 72, 0.8) !important;
          border-radius: 12px !important;
          box-shadow: 0 0 20px rgba(225, 29, 72, 0.4) !important;
        }
        #cgv-qr-reader__dashboard {
          display: none !important;
        }

        .scanner-laser-line {
          position: absolute;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #f43f5e, #fb7185, #f43f5e, transparent);
          box-shadow: 0 0 10px #f43f5e;
          pointer-events: none;
          animation: scanLaser 2s ease-in-out infinite alternate;
          z-index: 5;
        }

        @keyframes scanLaser {
          0% { top: 20%; opacity: 0.8; }
          100% { top: 75%; opacity: 0.8; }
        }

        .scan-banner-error {
          animation: shakeError 0.4s ease-in-out;
        }

        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .spin {
          animation: spinAnim 1s linear infinite;
        }

        @keyframes spinAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}