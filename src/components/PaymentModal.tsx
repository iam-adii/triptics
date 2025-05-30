import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import PDFWrapper from './PDFWrapper';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
  companySettings?: any;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, payment, companySettings }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogDescription>
            View and download the payment receipt
          </DialogDescription>
        </DialogHeader>
        <PDFWrapper
          type="payment"
          data={payment}
          companySettings={companySettings}
          showPaid={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal; 