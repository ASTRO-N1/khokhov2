// design/src/components/ui/calendar.tsx
"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react@0.487.0";
import { DayPicker } from "react-day-picker@8.10.1";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)} // Changed p-3 to p-4
      classNames={{
        months: "flex flex-col sm:flex-row gap-4", // Changed gap-2 to gap-4
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2", // Added mb-2
        caption_label: "tracking-wide text-blue-900", // Changed styles
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          // Updated nav button styles significantly
          "h-8 w-8 bg-white border-gray-200 p-0 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-lg"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1", // Changed space-x-1 to space-y-1
        head_row: "flex",
        head_cell:
          // Updated head cell styles
          "text-gray-500 rounded-md w-10 tracking-wide uppercase text-xs",
        row: "flex w-full mt-2",
        cell: cn(
          // Updated cell styles
          "relative p-0 text-center focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-blue-50 [&:has([aria-selected].day-outside)]:bg-gray-50/50",
          "[&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-range-start)]:rounded-l-lg",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-lg [&:has(>.day-range-start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
            : "[&:has([aria-selected])]:rounded-lg"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          // Updated day styles
          "h-10 w-10 p-0 aria-selected:opacity-100 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition-all duration-200"
        ),
        day_range_start:
          // Added rounded class
          "day-range-start rounded-l-lg",
        day_range_end:
          // Added rounded class
          "day-range-end rounded-r-lg",
        day_selected:
          // Updated selected day styles
          "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white shadow-md",
        day_today:
          // Updated today styles
          "bg-red-50 text-red-600 border border-red-200 rounded-lg",
        day_outside:
          // Updated outside day styles
          "day-outside text-gray-400 opacity-50 aria-selected:bg-gray-50/50 aria-selected:text-gray-400 aria-selected:opacity-30",
        day_disabled:
          // Updated disabled day styles
          "text-gray-300 opacity-50 cursor-not-allowed",
        day_range_middle:
          // Updated range middle styles
          "aria-selected:bg-blue-50 aria-selected:text-blue-900 rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          // Updated icon styles
          <ChevronLeft
            className={cn("h-4 w-4 text-gray-600", className)}
            {...props}
          />
        ),
        IconRight: ({ className, ...props }) => (
          // Updated icon styles
          <ChevronRight
            className={cn("h-4 w-4 text-gray-600", className)}
            {...props}
          />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
