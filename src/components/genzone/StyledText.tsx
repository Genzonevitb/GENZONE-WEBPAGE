import { useText } from "@/lib/config-context";
import type { ElementType, HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLElement> {
  id: string;
  defaultText: string;
  as?: ElementType;
}
export function StyledText({ id, defaultText, as: Tag = "span", className, ...rest }: Props) {
  const text = useText(id, defaultText);
  return <Tag className={className} {...rest}>{text}</Tag>;
}
