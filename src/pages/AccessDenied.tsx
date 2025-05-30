import React from "react";
import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Access Denied</h1>
        <div className="bg-red-100 text-red-800 p-6 rounded-lg mb-6">
          <p className="text-lg mb-4">
            You don't have permission to access this page.
          </p>
          <p>
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link
            to="/"
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 