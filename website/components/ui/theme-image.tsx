"use client";

import Image, { ImageProps } from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeImageProps extends Omit<ImageProps, "src"> {
  srcLight: string;
  srcDark: string;
}

export function ThemeImage({ srcLight, srcDark, alt, ...props }: ThemeImageProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Image
        src={srcLight}
        alt={alt}
        {...props}
      />
    );
  }

  return (
    <Image
      src={resolvedTheme === "dark" ? srcDark : srcLight}
      alt={alt}
      {...props}
    />
  );
}
