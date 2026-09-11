"use client";

import { MessageCircle } from "lucide-react";
import PageTitle from "@/components/custom/PageTitle";

export default function Chat() {
  return (
    <>
      <PageTitle title="Chat" icon={<MessageCircle />} />
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          Chat functionality coming soon!
        </div>
      </div>
    </>
  );
}
