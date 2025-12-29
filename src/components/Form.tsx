import React, { useEffect, useRef, useState } from "react";
import {
  parseAttributes,
  useEmailChange,
  useGenericChange,
  usePhoneChange,
} from "../utils/index";
import { JSONInput } from "./JSONInput";

export interface OptionData {
  value: string | number;
  label: string;
}

export interface FormField<T> {
  name: keyof T;
  label: string;
  type: "text" | "number" | "select" | "radio" | "phone" | "email" | "json";
  options?: OptionData[];
  required: boolean;
  dependsOn?: keyof T;
  getOptions?: (
    value: unknown,
    allData: Record<string, unknown>
  ) => OptionData[] | Promise<OptionData[]>;
}

interface FormProps<T extends object> {
  fields: FormField<T>[];
  onSubmit: (data: Partial<T>) => Promise<void> | void; // ✅ match your handlers
  onClose: () => void;
  initialData: T;
}

const Form = <T extends object>({
  fields,
  onSubmit,
  onClose,
  initialData,
}: FormProps<T>) => {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData as Record<string, unknown>);

  const [dynamicOptions, setDynamicOptions] = useState<
    Record<string, OptionData[]>
  >({});

  const prevDataRef = useRef<Record<string, unknown>>(formData);

  // Extract dependent fields
  const dependentFields = fields.filter(
    (f) => f.dependsOn && f.getOptions
  ) as Array<{
    name: keyof T;
    label: string;
    dependsOn: keyof T;
    getOptions: (v: unknown, all: Record<string, unknown>) => OptionData[] | Promise<OptionData[]>;
  }>;

  /**
   * --- FIXED DYNAMIC OPTIONS LOADING ---
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const prev = prevDataRef.current;

    Object.keys(formData).forEach(async (changedKey) => {
      if (formData[changedKey] !== prev[changedKey]) {
        // find dynamic field whose dependsOn matches changedKey
        const target = dependentFields.find(
          (f) => String(f.dependsOn) === changedKey
        );

        if (target) {
          const result = await target.getOptions(formData[changedKey], formData);
          console.log("OPTIONS FOR", target.name, result);

          setDynamicOptions((prev) => ({
            ...prev,
            [String(target.name)]: result ?? [],
          }));
        }
      }
    });

    prevDataRef.current = formData;
  }, [formData]);

  const handleChange = useGenericChange(setFormData);
  const handlePhoneChange = usePhoneChange(setFormData, 10);
  const handleEmailChange = useEmailChange(setFormData);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData as Partial<T>);
    setFormData(initialData as Record<string, unknown>);
    onClose();
  };

  /**
   * --------------------
   *   INPUT RENDERER
   * --------------------
   */
  const renderInput = (field: FormField<T>) => {
    const key = String(field.name);

    switch (field.type) {
      case "select": {
        const isDynamic = field.dependsOn && field.getOptions;
        const dynamicKey = String(field.name);

        const finalOptions = isDynamic
          ? dynamicOptions[dynamicKey] ?? []
          : field.options ?? [];

        return (
          <select
            id={key}
            name={key}
            value={String(formData[key] ?? "")}
            onChange={handleChange}
            required={field.required}
            className="
            p-3 rounded-lg w-full
            border border-gray-300 dark:border-gray-700
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          >
            <option value="">Select an option</option>
            {finalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }

      case "text":
      case "number":
        return (
          <input
            id={key}
            name={key}
            type={field.type}
            value={String(formData[key] ?? "")}
            onChange={handleChange}
            required={field.required}
            className="
            p-3 rounded-lg w-full
            border border-gray-300 dark:border-gray-700
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          />
        );

      case "radio":
        return (
          <div className="flex gap-3 items-center flex-wrap">
            {field.options?.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <input
                  id={key + "_" + opt.value}
                  name={key}
                  type="radio"
                  value={opt.value}
                  checked={formData[key] === opt.value}
                  onChange={handleChange}
                  required={field.required}
                  className="accent-blue-500"
                />
                <label
                  htmlFor={key + "_" + opt.value}
                  className="text-gray-800 dark:text-gray-200"
                >
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        );

      case "phone":
        return (
          <input
            id={key}
            name={key}
            type="text"
            value={String(formData[key] ?? "")}
            onChange={handlePhoneChange}
            required={field.required}
            className="
            p-3 rounded-lg w-full
            border border-gray-300 dark:border-gray-700
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          />
        );

      case "email":
        return (
          <input
            id={key}
            name={key}
            type="email"
            value={String(formData[key] ?? "")}
            onChange={handleEmailChange}
            required={field.required}
            className="
            p-3 rounded-lg w-full
            border border-gray-300 dark:border-gray-700
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          />
        );

      case "json":
        return (
          <div className="dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg p-2">
            <JSONInput
              id={key}
              name={key}
              // theme="dark_vscode_tribute"
              // style={{ body: { backgroundColor: "#1f2937" } }}
              value={parseAttributes(JSON.stringify(formData[key] ?? "{}"))}
              onChange={(data) => {
                setFormData((prev) => ({
                  ...prev,
                  [key]: JSON.stringify(data),
                }));
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
      w-full max-w-5xl mx-auto p-6 rounded-xl
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-700
    "
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field) => (
          <div key={String(field.name)} className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
            {renderInput(field)}
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 items-center px-4 py-3">
        <button
          type="submit"
          className="
          mt-8 w-full py-3 rounded-lg font-semibold text-lg
          bg-blue-600 hover:bg-blue-700
          text-white transition
        "
        >
          Submit
        </button>

        <button
          type="button"
          onClick={onClose}
          className="
          mt-8 w-full py-3 rounded-lg font-semibold text-lg
          bg-slate-500 hover:bg-slate-600
          text-white transition
        "
        >
          Close
        </button>
      </div>
    </form>
  );

};

export default Form;
