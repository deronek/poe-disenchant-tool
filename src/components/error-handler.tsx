"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const ERROR_TITLE = "An error occurred";
const ERROR_MESSAGE =
  "Something went wrong with the application. Please try again.";

export function ErrorHandler() {
  useEffect(() => {
    const showToast = () => {
      toast.error(ERROR_TITLE, {
        description: ERROR_MESSAGE,
      });
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error || event.message);
      showToast();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection caught:", event.reason);
      showToast();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return null;
}
