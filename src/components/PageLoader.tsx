import React, { useEffect, useState } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { cn } from "@/lib/utils";

export function PageLoader() {
  const { isLoading } = useLoading();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      // Delay hiding the loader to allow for exit animation
      const timer = setTimeout(() => {
        setShow(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show && !isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center",
        isLoading ? "page-loader-enter" : "page-loader-exit"
      )}
    >
      <div className="loader-container">
        <div className="loader-line"></div>
        <div className="loader-pin"></div>
      </div>
    </div>
  );
} 