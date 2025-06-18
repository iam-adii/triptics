import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().min(1, "Phone number is required"),
  source: z.string().optional(),
  status: z.string().default("New"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface LeadFormProps {
  lead?: FormValues & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeadForm({ lead, onSuccess, onCancel }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      source: lead?.source || "",
      status: lead?.status || "New",
      notes: lead?.notes || "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      // Normalize email - if it's empty string, set to null to handle database constraints better
      const normalizedEmail = values.email?.trim() === '' ? null : values.email;
      
      if (lead?.id) {
        // Update existing lead
        const { error } = await supabase
          .from("leads")
          .update({
            name: values.name,
            email: normalizedEmail,
            phone: values.phone,
            source: values.source,
            status: values.status,
            notes: values.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lead.id);

        if (error) throw error;
        toast.success("Lead updated successfully");
      } else {
        // Create new lead
        const { error } = await supabase.from("leads").insert({
          name: values.name,
          email: normalizedEmail,
          phone: values.phone,
          source: values.source,
          status: values.status,
          notes: values.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        toast.success("Lead created successfully");
      }

      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Failed to save lead. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Full name" 
                    {...field} 
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Email address" 
                    {...field} 
                    className="bg-background"
                    required={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Phone number" 
                    {...field}
                    required
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select lead source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Advertisement">Advertisement</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="New">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                      New
                    </div>
                  </SelectItem>
                  <SelectItem value="Contacted">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-purple-500 mr-2" />
                      Contacted
                    </div>
                  </SelectItem>
                  <SelectItem value="Qualified">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                      Qualified
                    </div>
                  </SelectItem>
                  <SelectItem value="Lost">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                      Lost
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional information about the lead..."
                  className="resize-none bg-background min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="min-w-[100px]"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit"
            className="min-w-[100px] bg-emerald-500 hover:bg-emerald-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {lead?.id ? "Updating..." : "Creating..."}
              </>
            ) : (
              lead?.id ? "Update Lead" : "Create Lead"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
