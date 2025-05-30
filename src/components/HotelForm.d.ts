import { Hotel } from "@/types/hotel";

export interface HotelFormProps {
  hotel: Hotel | null;
  onClose: (refresh?: boolean) => void;
}

export declare function HotelForm(props: HotelFormProps): JSX.Element; 