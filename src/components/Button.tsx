import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "link";

const baseClasses =
  "transition-transform duration-200 ease-out hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed";

const disabledFill =
  "disabled:bg-line disabled:text-navy disabled:hover:bg-line";

const variantClasses: Record<Variant, string> = {
  primary: `inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-6 py-4 text-base font-bold whitespace-nowrap text-white hover:bg-brand-hover md:min-h-14 md:px-8 md:text-base ${disabledFill}`,
  secondary: `inline-flex min-h-11 items-center justify-center rounded-xl bg-magenta px-6 py-4 text-base font-bold whitespace-nowrap text-white hover:opacity-90 md:min-h-14 md:px-8 md:text-lg ${disabledFill}`,
  link: "inline-flex min-h-11 items-center justify-center rounded-xl bg-white/95 px-6 py-4 text-base font-bold whitespace-nowrap text-navy hover:bg-white md:min-h-14 md:px-8",
};

type BaseProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

type AnchorProps = BaseProps & {
  href: string;
} & Omit<ComponentProps<"a">, "className" | "children" | "href">;

type ButtonAsButtonProps = BaseProps & {
  href?: undefined;
} & Omit<ComponentProps<"button">, "className" | "children">;

type Props = AnchorProps | ButtonAsButtonProps;

export default function Button({
  variant = "primary",
  className,
  children,
  ...props
}: Props) {
  const classes = [baseClasses, variantClasses[variant], className]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href !== undefined) {
    return (
      <a className={classes} {...(props as AnchorProps)}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(props as ButtonAsButtonProps)}
    >
      {children}
    </button>
  );
}
