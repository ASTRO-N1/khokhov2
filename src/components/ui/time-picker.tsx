"use client";

import * as React from "react";
import { Clock } from "lucide-react@0.487.0";
import { cn } from "./utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";

interface TimePickerProps {
  time?: string;
  onTimeChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  time = "",
  onTimeChange,
  placeholder = "Select time",
  disabled = false,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Parse time string (HH:mm format)
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hours: 12, minutes: 0, period: 'AM' };
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return { hours: displayHours, minutes, period };
  };

  const { hours: currentHours, minutes: currentMinutes, period: currentPeriod } = parseTime(time);
  const [selectedHours, setSelectedHours] = React.useState(currentHours);
  const [selectedMinutes, setSelectedMinutes] = React.useState(currentMinutes);
  const [selectedPeriod, setSelectedPeriod] = React.useState(currentPeriod);

  // Update state when time prop changes
  React.useEffect(() => {
    const { hours, minutes, period } = parseTime(time);
    setSelectedHours(hours);
    setSelectedMinutes(minutes);
    setSelectedPeriod(period);
  }, [time]);

  const formatTime = (hrs: number, mins: number, period: string) => {
    let hours24 = hrs;
    if (period === 'PM' && hrs !== 12) hours24 = hrs + 12;
    if (period === 'AM' && hrs === 12) hours24 = 0;
    return `${hours24.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return null;
    const { hours, minutes, period } = parseTime(timeStr);
    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleConfirm = () => {
    const formattedTime = formatTime(selectedHours, selectedMinutes, selectedPeriod);
    onTimeChange?.(formattedTime);
    setOpen(false);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left h-10 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200",
            !time && "text-gray-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-5 w-5 text-gray-400" />
          {time ? (
            <span className="text-gray-900">{formatDisplayTime(time)}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-white shadow-xl rounded-xl border-gray-200" 
        align="start"
      >
        <div className="p-4">
          <div className="flex gap-2 mb-3">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-2 text-center">Hour</div>
              <ScrollArea className="h-48 border rounded-lg border-gray-200">
                <div className="p-1">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => setSelectedHours(hour)}
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-md transition-all duration-200",
                        selectedHours === hour
                          ? "bg-blue-600 text-white font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-2 text-center">Minute</div>
              <ScrollArea className="h-48 border rounded-lg border-gray-200">
                <div className="p-1">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      onClick={() => setSelectedMinutes(minute)}
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-md transition-all duration-200",
                        selectedMinutes === minute
                          ? "bg-blue-600 text-white font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* AM/PM */}
            <div className="w-16">
              <div className="text-xs text-gray-500 mb-2 text-center">Period</div>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedPeriod('AM')}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-md transition-all duration-200",
                    selectedPeriod === 'AM'
                      ? "bg-blue-600 text-white font-medium"
                      : "hover:bg-gray-100 text-gray-700 border border-gray-200"
                  )}
                >
                  AM
                </button>
                <button
                  onClick={() => setSelectedPeriod('PM')}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-md transition-all duration-200",
                    selectedPeriod === 'PM'
                      ? "bg-blue-600 text-white font-medium"
                      : "hover:bg-gray-100 text-gray-700 border border-gray-200"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
          >
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}