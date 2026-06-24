import Image from "next/image";

type CodeMastiTextLogoProps = {
  /** header = main pages, footer = smaller footer mark */
  variant?: "header" | "footer";
  priority?: boolean;
  className?: string;
};

export function CodeMastiTextLogo({
  variant = "header",
  priority = false,
  className = "",
}: CodeMastiTextLogoProps) {
  const variantClass =
    variant === "footer" ? "pr-text-logo pr-text-logo--footer" : "pr-text-logo";

  return (
    <Image
      src="/text-logo.png"
      alt="CodeMasti — Think. Solve. Create."
      width={280}
      height={80}
      priority={priority}
      className={[variantClass, className].filter(Boolean).join(" ")}
    />
  );
}
