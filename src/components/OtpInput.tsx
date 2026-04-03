"use client";

import { useEffect, useRef, useState } from "react";

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  color?: string; // e.g., "sky" or "orange"
}

export function OtpInput({ length, value, onChange, disabled, color = "sky" }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync internal state with prop
  useEffect(() => {
    if (value.length === length) {
      setDigits(value.split(""));
    } else if (value === "") {
      setDigits(Array(length).fill(""));
    }
  }, [value, length]);

  const handleChange = (index: number, val: string) => {
    if (disabled) return;
    
    // Only allow numbers
    const cleanedVal = val.replace(/\D/g, "");
    if (!cleanedVal && val !== "") return;

    const newDigits = [...digits];
    const lastChar = cleanedVal.slice(-1);
    newDigits[index] = lastChar;
    setDigits(newDigits);

    const fullValue = newDigits.join("");
    onChange(fullValue);

    // Focus next input if a digit was entered
    if (lastChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Focus previous input on backspace if current cell is empty
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    
    if (pasteData) {
      const newDigits = [...digits];
      pasteData.split("").forEach((char, i) => {
        if (i < length) newDigits[i] = char;
      });
      setDigits(newDigits);
      onChange(newDigits.join(""));
      
      // Focus the last filled input or the last input
      const focusIndex = Math.min(pasteData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const borderColor = color === "orange" ? "group-focus-within:border-orange-500" : "group-focus-within:border-sky-500";
  const ringColor = color === "orange" ? "focus:ring-orange-500/30" : "focus:ring-sky-500/30";
  const caretColor = color === "orange" ? "caret-orange-500" : "caret-sky-500";

  return (
    <div className="flex justify-between gap-2 md:gap-3 group">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-full h-14 md:h-16 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-xl md:text-2xl font-bold text-white outline-none transition-all focus:border-${color}-500 focus:ring-4 ${ringColor} ${caretColor} disabled:opacity-50`}
          placeholder="0"
        />
      ))}
    </div>
  );
}
