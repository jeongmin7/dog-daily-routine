"use client";

/* UI 프리미티브: Button / Field / TextInput / TextArea — 하루 시안 기준. */

import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

type BtnVariant = "primary" | "outline" | "ghost" | "destructive";

export function Btn({
  variant = "primary",
  size,
  block,
  loading,
  loadingText,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm";
  block?: boolean;
  loading?: boolean;
  loadingText?: ReactNode;
}) {
  const cls = ["btn", "btn-" + variant, size === "sm" ? "btn-sm" : "", block ? "btn-block" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <span className="spin" />}
      {loading ? loadingText || children : children}
    </button>
  );
}

export function Field({
  label,
  optional,
  error,
  htmlFor,
  children,
}: {
  label?: ReactNode;
  optional?: boolean;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {optional && <span className="opt">(선택)</span>}
        </label>
      )}
      {children}
      {error && <div className="field-error fade-in">{error}</div>}
    </div>
  );
}

export function TextInput({
  invalid,
  filled,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; filled?: boolean }) {
  return (
    <input
      className={["input", filled ? "filled" : "", invalid ? "invalid" : "", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

export function TextArea({
  invalid,
  filled,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; filled?: boolean }) {
  return (
    <textarea
      className={["textarea", filled ? "filled" : "", invalid ? "invalid" : "", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
