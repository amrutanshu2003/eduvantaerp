import { useState, useEffect, useRef } from "react";
import { FiClock } from "react-icons/fi";

const RoundTimePicker = ({ value = "09:00 AM", onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("hours"); // 'hours' or 'minutes'
  
  // Parse initial value
  const parseTime = (timeStr) => {
    try {
      const cleanStr = String(timeStr || "").trim();
      const hasPeriod = /am|pm/i.test(cleanStr);
      
      if (hasPeriod) {
        const [time, period] = cleanStr.split(/\s+/);
        const [h, m] = time.split(":").map(Number);
        return { hour: h || 9, minute: m || 0, period: (period || "AM").toUpperCase(), is24: false };
      } else {
        const [h, m] = cleanStr.split(":").map(Number);
        const period = h >= 12 ? "PM" : "AM";
        let displayHour = h % 12;
        if (displayHour === 0) displayHour = 12;
        return { hour: displayHour, minute: m || 0, period, is24: true };
      }
    } catch (e) {
      return { hour: 9, minute: 0, period: "AM", is24: false };
    }
  };

  const initialParsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(initialParsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialParsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(initialParsed.period);

  const clockRef = useRef(null);
  const isDragging = useRef(false);

  // Sync state when prop value changes externally
  useEffect(() => {
    const parsed = parseTime(value);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  }, [value, isOpen]);

  const handleApply = () => {
    const is24 = parseTime(value).is24;
    if (is24) {
      let h24 = selectedHour;
      if (selectedPeriod === "PM" && selectedHour !== 12) h24 += 12;
      if (selectedPeriod === "AM" && selectedHour === 12) h24 = 0;
      const paddedHour = String(h24).padStart(2, "0");
      const paddedMinute = String(selectedMinute).padStart(2, "0");
      if (onChange) {
        onChange(`${paddedHour}:${paddedMinute}`);
      }
    } else {
      const paddedHour = String(selectedHour).padStart(2, "0");
      const paddedMinute = String(selectedMinute).padStart(2, "0");
      const newTime = `${paddedHour}:${paddedMinute} ${selectedPeriod}`;
      if (onChange) {
        onChange(newTime);
      }
    }
    setIsOpen(false);
  };

  const handleInteractiveSelect = (clientX, clientY) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180 to 180
    angle = angle + 90; // offset so top is 0
    if (angle < 0) angle += 360;

    if (mode === "hours") {
      let hour = Math.round(angle / 30);
      if (hour === 0) hour = 12;
      setSelectedHour(hour);
    } else {
      let minute = Math.round(angle / 6);
      if (minute === 60) minute = 0;
      // Round to nearest minute, or we can round to 5 mins if desired
      setSelectedMinute(minute);
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    handleInteractiveSelect(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    handleInteractiveSelect(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    // Automatically switch to minutes after selecting hour
    if (mode === "hours") {
      setTimeout(() => setMode("minutes"), 300);
    }
  };

  // Touch Support
  const handleTouchStart = (e) => {
    isDragging.current = true;
    if (e.touches.length > 0) {
      handleInteractiveSelect(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    if (e.touches.length > 0) {
      handleInteractiveSelect(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Generate Clock Numbers Positions
  const renderClockNumbers = () => {
    const radius = 90; // radius of clock layout in px
    const numbers = [];
    
    if (mode === "hours") {
      for (let h = 1; h <= 12; h++) {
        const angle = (h * 30 - 90) * (Math.PI / 180);
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const isSelected = selectedHour === h;
        numbers.push(
          <div
            key={h}
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
            className={`absolute flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors duration-150 cursor-pointer select-none ${
              isSelected
                ? "bg-indigo-600 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
            onClick={() => {
              setSelectedHour(h);
              setTimeout(() => setMode("minutes"), 200);
            }}
          >
            {h}
          </div>
        );
      }
    } else {
      // Show minutes by 5 mins interval
      for (let m = 0; m < 12; m++) {
        const minVal = m * 5;
        const angle = (minVal * 6 - 90) * (Math.PI / 180);
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const isSelected = selectedMinute === minVal;
        numbers.push(
          <div
            key={minVal}
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
            className={`absolute flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer select-none ${
              isSelected
                ? "bg-indigo-600 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
            onClick={() => setSelectedMinute(minVal)}
          >
            {String(minVal).padStart(2, "0")}
          </div>
        );
      }
    }
    return numbers;
  };

  // Clock Hand Angle
  const getHandRotation = () => {
    if (mode === "hours") {
      return selectedHour * 30;
    } else {
      return selectedMinute * 6;
    }
  };

  return (
    <div className="relative">
      {/* Time Picker Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none hover:border-slate-300 w-full text-left"
      >
        <FiClock className="text-slate-400 shrink-0" />
        <span className="flex-1">{value}</span>
      </button>

      {/* Popover / Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl my-auto">
            
            {/* Header Display */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 w-full justify-center">
              <div className="flex items-center text-4xl font-extrabold tracking-tight tabular-nums">
                <button
                  type="button"
                  onClick={() => setMode("hours")}
                  className={`px-2 py-1 rounded-xl transition-colors ${
                    mode === "hours"
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {String(selectedHour).padStart(2, "0")}
                </button>
                <span className="mx-1 text-slate-400">:</span>
                <button
                  type="button"
                  onClick={() => setMode("minutes")}
                  className={`px-2 py-1 rounded-xl transition-colors ${
                    mode === "minutes"
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {String(selectedMinute).padStart(2, "0")}
                </button>
              </div>

              {/* AM/PM Selectors */}
              <div className="flex flex-col gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("AM")}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedPeriod === "AM"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("PM")}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedPeriod === "PM"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Sub-Header Helper */}
            <p className="text-xs text-slate-400 font-medium mb-4">
              {mode === "hours" ? "Drag or select hour number" : "Drag or select minute number"}
            </p>

            {/* Circular Clock Dial */}
            <div
              ref={clockRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="relative flex items-center justify-center w-56 h-56 rounded-full bg-slate-50 border border-slate-200/80 shadow-inner cursor-pointer"
            >
              {/* Central Pivot Dot */}
              <div className="absolute w-3 h-3 rounded-full bg-indigo-600 z-20"></div>

              {/* Hand Pointer */}
              <div
                style={{
                  transform: `rotate(${getHandRotation()}deg)`,
                  height: "80px",
                }}
                className="absolute bottom-1/2 left-1/2 w-[2px] bg-indigo-600 origin-bottom z-10 transition-transform duration-150 ease-out"
              >
                {/* Pointer tip indicator */}
                <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-indigo-600"></div>
              </div>

              {/* Numbers overlay */}
              {renderClockNumbers()}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex w-full items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95 transition-transform"
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default RoundTimePicker;
