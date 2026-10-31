import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";
import { TrackNavigation } from "../loading/SectionLoading";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "white";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] font-semibold transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-pink-dark border-pink-dark text-white hover:bg-pink-deep hover:border-pink-deep",
  secondary: "bg-transparent border-pink-dark text-pink-dark hover:bg-tint",
  ghost: "bg-transparent border-transparent text-ink hover:bg-tint",
  danger: "bg-danger border-danger text-white hover:opacity-90",
  white: "bg-white border-white text-pink-dark hover:bg-blush",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-[15px]",
  lg: "px-7 py-3.5 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", block = false) {
  return cn(base, variants[variant], sizes[size], block && "w-full");
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant, size, block, loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(buttonClass(variant, size, block), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      {children}
    </button>
  );
}

export interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

/** Link styled as a button. In-app navigations also drive the section loader (see components/loading). */
export function LinkButton({ variant, size, block, className, children, ...rest }: LinkButtonProps) {
  return <Link className={cn(buttonClass(variant, size, block), className)} {...rest}>{children}<TrackNavigation /></Link>;
}
