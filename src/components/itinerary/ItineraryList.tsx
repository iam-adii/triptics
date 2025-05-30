import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItineraryListItem } from "./ItineraryListItem";
import { Itinerary } from "@/types/itinerary";

interface ItineraryListProps {
  itineraries: Itinerary[];
  isLoading: boolean;
  onOpenBuilder: (itinerary: Itinerary) => void;
  onEditItinerary: (itinerary: Itinerary) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (itinerary: Itinerary) => void;
}

export function ItineraryList({
  itineraries,
  isLoading,
  onOpenBuilder,
  onEditItinerary,
  onPublish,
  onArchive,
  onDelete,
  onShare,
}: ItineraryListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <p className="text-muted-foreground">No itineraries found. Create a new itinerary to get started.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Destination</TableHead>
            <TableHead className="hidden md:table-cell">Client</TableHead>
            <TableHead className="hidden md:table-cell">Dates</TableHead>
            <TableHead className="hidden md:table-cell">Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Budget</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itineraries.map((itinerary) => (
            <ItineraryListItem
              key={itinerary.id}
              itinerary={itinerary}
              onOpenBuilder={onOpenBuilder}
              onEditItinerary={onEditItinerary}
              onPublish={onPublish}
              onArchive={onArchive}
              onDelete={onDelete}
              onShare={onShare}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
