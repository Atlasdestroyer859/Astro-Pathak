'use client';
import { QRCodeCanvas } from 'qrcode.react';

type Props = { amount: number; upiId: string; name: string; bookingId: string; };

export default function UpiQr({ amount, upiId, name, bookingId }: Props) {
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('AstroPathak ' + bookingId)}`;

  return (
    <div className="upi-section">
      <div className="upi-title">💳 UPI Payment</div>
      <div className="upi-amount">₹1,100 <span>/ consultation</span></div>
      <div className="upi-desc">Scan QR code with any UPI app • PhonePe • GPay • Paytm • BHIM</div>
      <div className="upi-qr">
        <div className="upi-qr-box">
          <QRCodeCanvas value={upiString} size={180} level="M" />
        </div>
      </div>
      <div className="upi-id">UPI ID: <strong>{upiId}</strong></div>
      <div className="upi-steps">
        <div className="upi-step"><span className="upi-step-num">1</span>Open any UPI app on your phone</div>
        <div className="upi-step"><span className="upi-step-num">2</span>Scan the QR code above</div>
        <div className="upi-step"><span className="upi-step-num">3</span>Pay ₹1,100 and note the transaction ID</div>
        <div className="upi-step"><span className="upi-step-num">4</span>Submit booking — admin marks payment on confirmation</div>
      </div>
    </div>
  );
}
