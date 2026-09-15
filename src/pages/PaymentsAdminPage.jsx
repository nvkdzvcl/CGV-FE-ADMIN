import React, { useState } from 'react';
import { CreditCard, CheckCircle, RefreshCw } from 'lucide-react';
import { INITIAL_PAYMENTS } from '../data/adminMockData';

export default function PaymentsAdminPage() {
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);

  return (
    <div className="payments-admin-page">
      <div className="table-panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Đối Soát Giao Dịch & Cổng Thanh Toán</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
              Idempotency Key & HMAC-SHA512 Webhook Verification
            </p>
          </div>

          <button className="btn-admin-secondary" onClick={() => alert('Đã đồng bộ kiểm tra đối soát với VNPay và MoMo.')}>
            <RefreshCw size={14} /> Kiểm Tra Lại Webhook
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Mã Đơn Vé</th>
                <th>Cổng Thanh Toán</th>
                <th>Mã Giao Dịch (Idempotency Key)</th>
                <th>Số Tiền</th>
                <th>Thời Gian</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td><code>{p.bookingId}</code></td>
                  <td>
                    <span className={`status-pill ${p.provider === 'VNPAY' ? 'info' : 'danger'}`}>
                      {p.provider}
                    </span>
                  </td>
                  <td><code style={{ color: 'var(--admin-primary-hover)' }}>{p.transactionId}</code></td>
                  <td><strong style={{ color: '#fff' }}>{p.amount.toLocaleString('vi-VN')} đ</strong></td>
                  <td>{p.createdAt}</td>
                  <td>
                    <span className={`status-pill ${p.status === 'SUCCESS' ? 'success' : 'warning'}`}>
                      {p.status === 'SUCCESS' ? 'Thành công' : 'Đang xử lý'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-admin-secondary btn-admin-sm"
                      onClick={() => alert(`Chi tiết giao dịch: ${p.transactionId}
Trạng thái: ${p.status}`)}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}