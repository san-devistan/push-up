/**
 * Surface — an elevated container.
 *
 * The default surface mirrors the workout controls. Secondary and tertiary
 * increase contrast from the page background for clearly nested depth.
 *
 * ```tsx
 * <Surface>
 *   <Surface variant="secondary">
 *     <Surface variant="tertiary">…</Surface>
 *   </Surface>
 * </Surface>
 * ```
 */
import { BlurView, type BlurTint } from 'expo-blur';
import { forwardRef } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { tv, type VariantProps } from 'tailwind-variants';

const surfaceVariants = tv({
  base: 'overflow-hidden rounded-3xl',
  variants: {
    variant: {
      default: '',
      secondary: '',
      tertiary: '',
      destructive: '',
      transparent: '',
    },
    padding: {
      none: '',
      sm: 'p-2.5',
      default: 'p-4',
      lg: 'p-6',
    },
    bordered: {
      true: 'border border-white/60 dark:border-white/[0.16]',
    },
    elevated: {
      true: 'shadow-lg shadow-black/10 dark:shadow-black/50',
    },
  },
  compoundVariants: [
    {
      bordered: true,
      class: 'border-white/20',
      variant: 'destructive',
    },
  ],
  defaultVariants: {
    bordered: true,
    variant: 'default',
    padding: 'default',
  },
});

type SurfaceVariant = NonNullable<VariantProps<typeof surfaceVariants>['variant']>;

const SURFACE_BLUR: Record<
  SurfaceVariant,
  { intensity: number; tint: BlurTint } | null
> = {
  default: { intensity: 48, tint: 'systemUltraThinMaterial' },
  secondary: { intensity: 64, tint: 'systemThinMaterial' },
  tertiary: { intensity: 80, tint: 'systemMaterial' },
  destructive: { intensity: 64, tint: 'systemUltraThinMaterial' },
  transparent: null,
};

const SURFACE_TINT: Record<SurfaceVariant, string> = {
  default: 'bg-[rgba(255,255,255,0.72)] dark:bg-[rgba(45,47,46,0.68)]',
  secondary: 'bg-[rgba(248,248,248,0.76)] dark:bg-[rgba(59,62,60,0.72)]',
  tertiary: 'bg-[rgba(240,240,240,0.8)] dark:bg-[rgba(75,79,76,0.76)]',
  destructive: 'bg-[rgba(230,0,0,0.68)]',
  transparent: 'bg-transparent',
};

export interface SurfaceProps
  extends ViewProps,
    VariantProps<typeof surfaceVariants> {
  className?: string;
  /**
   * The hairline is on by default. Pass false when a surface should dissolve
   * into its parent.
   */
  bordered?: boolean;
  /**
   * A soft shadow lifting the surface off the page. Off by default because a
   * nested surface reads its depth from its fill, not from a shadow it would
   * only cast onto its parent.
   */
  elevated?: boolean;
  /** Inner spacing. `none` is for a surface wrapping a bled image or a chart. */
  padding?: 'none' | 'sm' | 'default' | 'lg';
}

export const Surface = forwardRef<View, SurfaceProps>(
  ({ children, className, variant, padding, bordered, elevated, style, ...props }, ref) => {
    const resolvedVariant = variant ?? 'default';
    const blur = SURFACE_BLUR[resolvedVariant];

    return (
      <View
        ref={ref}
        // `borderCurve` has no Tailwind equivalent. On iOS it gives the
        // continuous (squircle) corner Apple uses, which is visibly smoother
        // than a circular arc at this radius; Android ignores it.
        style={[styles.root, style]}
        className={surfaceVariants({ variant, padding, bordered, elevated, className })}
        {...props}
      >
        {blur ? (
          <>
            <BlurView {...blur} pointerEvents="none" style={StyleSheet.absoluteFill} />
            <View
              className={SURFACE_TINT[resolvedVariant]}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : null}
        {children}
      </View>
    );
  }
);

Surface.displayName = 'Surface';

const styles = StyleSheet.create({
  root: { borderCurve: 'continuous' },
});
