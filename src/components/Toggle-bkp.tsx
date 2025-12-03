import React from "react";


interface ToggleProps {
  checked?: boolean;                // controlled value
  defaultChecked?: boolean;         // uncontrolled default
  activeImages?: [];
  inActiveImages?: [];
  onChange?: (value: boolean) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  label?: string;
}

export function Toggle({
  checked,
  defaultChecked,
  onChange,
  size = "md",
  disabled = false,
  label
}: ToggleProps) {
  const [internal, setInternal] = React.useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : internal;

  const toggle = () => {
    if (!disabled) {
      const newValue = !isOn;
      if (!isControlled) setInternal(newValue);
      onChange?.(newValue);
    }
  };

  const sizes = {
    sm: { circle: "h-3 w-3", track: "h-5 w-10", shift: "translate-x-5" },
    md: { circle: "h-4 w-4", track: "h-6 w-12", shift: "translate-x-6" },
    lg: { circle: "h-6 w-6", track: "h-8 w-16", shift: "translate-x-8" }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`relative flex items-center gap-2 
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {label && (
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}

      {/* Track */}
      <div
        className={`
          ${sizes[size].track}
          rounded-full transition-colors duration-300 
          ${isOn ? "bg-blue-500 dark:bg-blue-600" : "bg-gray-400 dark:bg-gray-600"}
          flex items-center px-1
        `}
      >
        {/* Circle */}
        <div
          className={`
            ${sizes[size].circle}
            rounded-full bg-white dark:bg-gray-200 shadow-md transform transition-transform duration-300
            ${isOn ? sizes[size].shift : "translate-x-0"}
          `}
        />
      </div>
    </button>
  );
}

export function FancyToggle({
  checked,
  defaultChecked,
  activeImages = [],
  inActiveImages = [],
  onChange,
  size = "md",
  disabled = false,
}: ToggleProps) {
  const [internal, setInternal] = React.useState(defaultChecked ?? false);

  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : internal;

  const toggle = () => {
    if (!disabled) {
      const newValue = !isOn;
      if (!isControlled) setInternal(newValue);
      onChange?.(newValue);
    }
  };

  const sizes = {
    sm: {
      track: "h-6 w-12",
      knob: "h-4 w-4",
      shift: "translate-x-6",
      icon: "w-3 h-3",
    },
    md: {
      track: "h-8 w-16",
      knob: "h-6 w-6",
      shift: "translate-x-8",
      icon: "w-4 h-4",
    },
    lg: {
      track: "h-12 w-24",
      knob: "h-10 w-10",
      shift: "translate-x-12",
      icon: "w-6 h-6",
    },
  };

  const ActiveLeft = activeImages[0];
  const InactiveLeft = inActiveImages[0];
  const ActiveRight = activeImages[1];
  const InactiveRight = inActiveImages[1];

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`relative inline-flex items-center 
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* Track */}
      <div
        className={`
          ${sizes[size].track}
          relative rounded-full
          bg-gray-300 dark:bg-gray-700
          transition-colors duration-300
        `}
      >
        {/* LEFT ICON */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-gray-700 dark:text-gray-300">
          {!isOn
            ? ActiveLeft && <ActiveLeft className={sizes[size].icon} />
            : InactiveLeft && <InactiveLeft className={sizes[size].icon} />}
        </div>

        {/* RIGHT ICON */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-gray-700 dark:text-gray-300">
          {isOn
            ? ActiveRight && <ActiveRight className={sizes[size].icon} />
            : InactiveRight && <InactiveRight className={sizes[size].icon} />}
        </div>

        {/* Knob */}
        <div
          className={`
            ${sizes[size].knob}
            absolute top-1 left-1 
            rounded-full 
            bg-white dark:bg-gray-200 
            border border-blue-300 dark:border-blue-500 
            shadow 
            transition-transform duration-300 ease-out 
            z-10
            ${isOn ? sizes[size].shift : ""}
          `}
        />
      </div>
    </button>
  );
}
