import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Eye, MoreHorizontal, MapPin, Calendar, Clock, Mail } from "lucide-react";
import { shareItineraryViaEmail } from '@/services/itineraryEmailService';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { Itinerary } from "@/types/itinerary";
import SendItineraryEmailButton from './SendItineraryEmailButton';

interface ItineraryListItemProps {
  itinerary: Itinerary;
  onOpenBuilder: (itinerary: Itinerary) => void;
  onEditItinerary: (itinerary: Itinerary) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (itinerary: Itinerary) => void;
}

export function ItineraryListItem({
  itinerary,
  onOpenBuilder,
  onEditItinerary,
  onPublish,
  onArchive,
  onDelete,
  onShare,
}: ItineraryListItemProps) {
  // Function to handle email sending
  const handleSendEmail = async () => {
    const loadingToast = toast.loading("Preparing email...");
    
    try {
      // Fetch days and activities data for this itinerary
      const { data: days = [], error: daysError } = await supabase
        .from("itinerary_days")
        .select("*, hotel:hotel_id(*)")
        .eq("itinerary_id", itinerary.id)
        .order("day_number");
      
      if (daysError) throw daysError;
      
      const { data: activities = [], error: activitiesError } = await supabase
        .from("itinerary_activities")
        .select("*, itinerary_day:itinerary_day_id(day_number)")
        .eq("itinerary_day.itinerary_id", itinerary.id)
        .order("sort_order");
      
      if (activitiesError) throw activitiesError;
      
      // Send the email
      await shareItineraryViaEmail(itinerary, days, activities);
      toast.dismiss(loadingToast);
    } catch (error) {
      console.error("Error sending itinerary email:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to send email. Please try again.");
    }
  };

  return (
    <TableRow key={itinerary.id} className="group">
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="line-clamp-1">{itinerary.name}</span>
          <span className="md:hidden text-xs text-muted-foreground mt-1">
            {itinerary.destination || "No destination"}
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-500" />
          <span className="line-clamp-1">{itinerary.destination || "Not specified"}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
              {itinerary.customers?.name
                ? itinerary.customers.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="line-clamp-1">{itinerary.customers?.name || "Not assigned"}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {itinerary.start_date && itinerary.end_date
            ? `${new Date(itinerary.start_date).toLocaleDateString()} - ${new Date(itinerary.end_date).toLocaleDateString()}`
            : "No dates set"}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {itinerary.duration ? `${itinerary.duration} days` : "Not set"}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            itinerary.status === "Published"
              ? "bg-emerald-500/20 text-emerald-600"
              : itinerary.status === "Draft"
              ? "bg-amber-500/20 text-amber-600"
              : "bg-gray-500/20 text-gray-600"
          }`}
        >
          {itinerary.status}
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {itinerary.budget ? `₹${itinerary.budget.toLocaleString()}` : "Not set"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onOpenBuilder(itinerary)}
            className="hover:bg-emerald-50 hover:text-emerald-600 h-9 w-9 p-0 md:h-8 md:w-8"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEditItinerary(itinerary)}
            className="hover:bg-emerald-50 hover:text-emerald-600 h-9 w-9 p-0 md:h-8 md:w-8"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-emerald-50 hover:text-emerald-600 h-9 w-9 p-0 md:h-8 md:w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {itinerary.status !== "Published" && (
                <DropdownMenuItem onClick={() => onPublish(itinerary.id)} className="hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer">
                  Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onOpenBuilder(itinerary)} className="hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer">
                Edit Itinerary Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(itinerary)} className="hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer">
                Share via WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer p-0">
                <SendItineraryEmailButton 
                  itinerary={itinerary}
                  variant="ghost"
                  className="w-full justify-start px-2 py-1.5 h-auto"
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer">
                Download PDF
              </DropdownMenuItem>
              {itinerary.status !== "Archived" && (
                <DropdownMenuItem onClick={() => onArchive(itinerary.id)} className="hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer">
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-red-500 hover:bg-red-50 cursor-pointer"
                onClick={() => onDelete(itinerary.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
