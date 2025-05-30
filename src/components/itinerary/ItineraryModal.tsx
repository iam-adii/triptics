import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import PDFWrapper from '../PDFWrapper';

interface ItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: any;
  days: any[];
  activities: any[];
  companySettings?: any;
}

const ItineraryModal: React.FC<ItineraryModalProps> = ({ 
  isOpen, 
  onClose, 
  itinerary, 
  days, 
  activities,
  companySettings 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Itinerary PDF</DialogTitle>
          <DialogDescription>
            View and download the itinerary
          </DialogDescription>
        </DialogHeader>
        <PDFWrapper
          type="itinerary"
          data={{ itinerary, days, activities }}
          companySettings={companySettings}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ItineraryModal; 