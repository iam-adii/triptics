
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

const emails = [
  {
    id: 1,
    from: "Johnson Family",
    email: "johnson@example.com",
    subject: "Golden Triangle Tour Inquiry",
    excerpt:
      "Hello, we are interested in booking the Golden Triangle Tour for our family of 4 in April...",
    date: "May 17, 2025 11:23 AM",
    read: false,
  },
  {
    id: 2,
    from: "Smith Couple",
    email: "smith@example.com",
    subject: "Kerala Backwaters Tour Confirmation",
    excerpt:
      "Thank you for confirming our booking for the Kerala Backwaters Retreat. We're excited...",
    date: "May 15, 2025 09:15 AM",
    read: true,
  },
  {
    id: 3,
    from: "Garcia Family",
    email: "garcia@example.com",
    subject: "Invoice Payment Confirmation",
    excerpt:
      "This is to confirm that we have made the payment for our upcoming Rajasthan tour...",
    date: "May 12, 2025 02:45 PM",
    read: true,
  },
];

export default function Email() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Email</h1>
          <p className="text-muted-foreground mt-1">
            Manage and send emails to your customers.
          </p>
        </div>
        <Button className="w-full sm:w-auto">Compose</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 bg-secondary/50 border-border/30 p-4 h-[calc(100vh-220px)]">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search emails..." 
                className="pl-10" 
              />
            </div>
            
            <Tabs defaultValue="inbox" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inbox">Inbox</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="drafts">Drafts</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="overflow-y-auto h-[calc(100vh-350px)] space-y-1 -mx-2">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`p-3 cursor-pointer rounded-md transition-colors ${
                    email.read
                      ? "hover:bg-muted/50"
                      : "bg-primary/10 hover:bg-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{email.from}</div>
                    <div className="text-xs text-muted-foreground">
                      {email.date.split(" ")[0]}
                    </div>
                  </div>
                  <div className="text-sm font-medium truncate">
                    {email.subject}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {email.excerpt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-3 bg-secondary/50 border-border/30 flex flex-col h-[calc(100vh-220px)]">
          <div className="border-b border-border p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-medium">Golden Triangle Tour Inquiry</h2>
                <div className="text-sm text-muted-foreground">
                  From: Johnson Family &lt;johnson@example.com&gt;
                </div>
                <div className="text-sm text-muted-foreground">
                  To: Triptics Travel &lt;info@triptics.example.com&gt;
                </div>
                <div className="text-sm text-muted-foreground">
                  May 17, 2025 11:23 AM
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  Reply
                </Button>
                <Button variant="ghost" size="sm">
                  Forward
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Mark as Unread</DropdownMenuItem>
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <p>Hello Triptics Team,</p>
              <p>
                We are a family of 4 (2 adults, 2 children aged 10 and 12) planning a trip to India in April 2025. We're particularly interested in your Golden Triangle Tour that covers Delhi, Agra, and Jaipur.
              </p>
              <p>
                Could you please provide us with more information about the tour, including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Detailed day-by-day itinerary</li>
                <li>Accommodation options (we prefer 4-5 star hotels)</li>
                <li>Transportation details</li>
                <li>Pricing for our family of 4</li>
                <li>Any customization options available</li>
              </ul>
              <p>
                We're flexible with dates in April, but would prefer to travel in the first half of the month. We'd like a 6-7 day tour if possible.
              </p>
              <p>
                Looking forward to your response.
              </p>
              <p>Best regards,<br />The Johnson Family</p>
            </div>
          </div>

          <div className="border-t border-border p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Select defaultValue="reply">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reply">Reply</SelectItem>
                    <SelectItem value="replyAll">Reply All</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Type your reply here..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end">
                <Button>Send</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
