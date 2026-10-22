import type { ButtonHTMLAttributes } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" };
export function Button({ variant: _variant, className = "", type = "button", ...props }: Props) {
  return <button type={type} className={className} {...props} />;
}
